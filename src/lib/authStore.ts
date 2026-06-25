'use client';

import { authFetch, dataFetch } from './dataApi';

export type UserRole = 'user' | 'author' | 'admin';
export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type SessionUser = { id: string; email: string };

export class AuthStore {
  private user: SessionUser | null = null;
  private profile: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();
  private _initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;
    await this.refreshSession();
    this._initialized = true;
    this.notifyListeners();
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  async refreshSession() {
    try {
      const data = (await authFetch('/session')) as {
        user: SessionUser | null;
        profile: UserProfile | null;
      };
      this.user = data.user;
      this.profile = data.profile;
    } catch {
      this.user = null;
      this.profile = null;
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  getCurrentUser(): SessionUser | null {
    return this.user;
  }

  getCurrentProfile(): UserProfile | null {
    return this.profile;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  hasRole(role: UserRole): boolean {
    return this.profile?.role === role;
  }

  canWriteArticles(): boolean {
    return this.hasRole('author') || this.hasRole('admin');
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async signInWithEmail(email: string, password: string) {
    const data = (await authFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })) as { user: SessionUser; profile: UserProfile };
    this.user = data.user;
    this.profile = data.profile;
    this.notifyListeners();
    return data;
  }

  async signUpWithEmail(email: string, password: string, fullName?: string) {
    const data = (await authFetch('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    })) as { user: SessionUser; profile: UserProfile };
    this.user = data.user;
    this.profile = data.profile;
    this.notifyListeners();
    return data;
  }

  async signInWithProvider(_provider: 'google' | 'yandex' | 'vk') {
    throw new Error(
      'Вход через соцсети временно отключён. Используйте email и пароль.'
    );
  }

  async signUpWithPhone(_phone: string) {
    throw new Error('Вход по телефону пока недоступен. Используйте email.');
  }

  async verifyPhoneOTP(_phone: string, _token: string) {
    throw new Error('Вход по телефону пока недоступен.');
  }

  async signOut() {
    try {
      await authFetch('/logout', { method: 'POST' });
    } catch {
      // ignore server errors — always clear local state
    }
    this.user = null;
    this.profile = null;
    this.notifyListeners();
  }

  async updateProfile(updates: Partial<UserProfile>) {
    if (!this.user || !this.profile) throw new Error('Not authenticated');

    const data = (await dataFetch('/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })) as UserProfile;

    this.profile = data;
    this.notifyListeners();
    return data;
  }
}

export const authStore = new AuthStore();
