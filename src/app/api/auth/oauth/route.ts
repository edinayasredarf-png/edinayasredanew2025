import { NextRequest, NextResponse } from 'next/server';
import { getTimewebPool } from '@/lib/timewebPg';
import { authCookieOptions, signUserSession, USER_AUTH_COOKIE } from '@/lib/server/userSession';
import { sanitizeProfile } from '@/lib/server/timewebAuthDb';
import { randomUUID } from 'node:crypto';

function jsonErr(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const { provider, providerId, email, name, avatarUrl } = await request.json();

    if (!provider || !providerId) return jsonErr('provider and providerId required');
    if (provider !== 'yandex' && provider !== 'vk') return jsonErr('unsupported provider');

    const pool = getTimewebPool();

    // 1. Check if oauth link already exists
    const { rows: oauthRows } = await pool.query(
      'SELECT user_id FROM user_oauth_providers WHERE provider=$1 AND provider_id=$2',
      [provider, String(providerId)]
    );

    let userId: string;

    if (oauthRows.length > 0) {
      userId = oauthRows[0].user_id;
      // Update avatar if changed
      if (avatarUrl) {
        await pool.query('UPDATE user_profiles SET avatar_url=$1, updated_at=now() WHERE id=$2', [avatarUrl, userId]);
      }
    } else {
      // 2. Try to find user by email
      let existingUserId: string | null = null;
      if (email) {
        const { rows: emailRows } = await pool.query(
          'SELECT id FROM user_profiles WHERE lower(trim(email))=lower(trim($1)) LIMIT 1',
          [email]
        );
        if (emailRows.length > 0) existingUserId = emailRows[0].id;
      }

      if (existingUserId) {
        userId = existingUserId;
      } else {
        // 3. Create new user
        userId = randomUUID();
        const userEmail = email || `${provider}_${providerId}@oauth.local`;
        await pool.query(
          `INSERT INTO user_profiles (id, email, full_name, avatar_url, role, password_hash, created_at, updated_at)
           VALUES ($1,$2,$3,$4,'user',null,now(),now())`,
          [userId, userEmail, name || null, avatarUrl || null]
        );
      }

      // 4. Link oauth provider
      await pool.query(
        'INSERT INTO user_oauth_providers (user_id, provider, provider_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [userId, provider, String(providerId)]
      );
    }

    // 5. Fetch profile and set cookie
    const { rows } = await pool.query('SELECT * FROM user_profiles WHERE id=$1', [userId]);
    const row = rows[0];
    if (!row) return jsonErr('User not found', 500);

    const token = signUserSession(row.id, row.email);
    const res = NextResponse.json({
      user: { id: row.id, email: row.email },
      profile: sanitizeProfile(row),
    });
    res.cookies.set(USER_AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (e) {
    console.error('OAuth login error:', e);
    return jsonErr(e instanceof Error ? e.message : 'Server error', 500);
  }
}
