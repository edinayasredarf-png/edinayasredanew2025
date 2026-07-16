'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authStore, UserProfile } from '@/lib/authStore';
import { sb_getUserFavorites } from '@/lib/commentsStore';
import { sb_listPosts } from '@/lib/blogStore';
import ProfileLayout from '@/components/ProfileLayout';
import Image from 'next/image';
import Link from 'next/link';
import PressAdmin from '@/components/admin/PressAdmin';

interface FavoritePost {
  id: string;
  title: string;
  slug: string;
  cover?: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [favoritePosts, setFavoritePosts] = useState<FavoritePost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    organization: '',
  });
  const [isRequestingAuthorRole, setIsRequestingAuthorRole] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAuth = () => {
      if (!authStore.isInitialized()) return;
      const authenticated = authStore.isAuthenticated();
      setIsAuthenticated(authenticated);
      setAuthChecked(true);
      if (authenticated) {
        const userProfile = authStore.getCurrentProfile();
        setProfile(userProfile);
        if (userProfile) {
          setEditData({
            full_name: userProfile.full_name || '',
            organization: userProfile.organization || '',
          });
        }
      } else {
        setProfile(null);
      }
    };

    syncAuth();
    const unsubscribe = authStore.subscribe(syncAuth);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        try {
          const favorites = await sb_getUserFavorites();
          const posts = await sb_listPosts();

          const favoritePostsData = favorites.map(fav => {
            const post = posts.find(p => p.id === fav.post_id);
            return post ? {
              id: post.id,
              title: post.title,
              slug: post.slug,
              cover: post.cover,
              created_at: new Date(post.createdAt).toISOString(),
            } : null;
          }).filter(Boolean) as FavoritePost[];

          setFavoritePosts(favoritePostsData);
        } catch (error) {
          console.error('Failed to load favorites:', error);
          setFavoritePosts([]);
        }
      })();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await authStore.updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Ошибка при сохранении профиля');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/uploads/image', { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json() as { url?: string };
      if (!data.url) throw new Error('No URL');
      await authStore.updateProfile({ avatar_url: data.url });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Ошибка при загрузке аватара');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRequestAuthorRole = async () => {
    if (!profile || !requestMessage.trim()) return;
    try {
      alert('Заявка на получение роли редактора отправлена!');
      setIsRequestingAuthorRole(false);
      setRequestMessage('');
    } catch (error) {
      console.error('Failed to request author role:', error);
      alert('Ошибка при отправке заявки');
    }
  };

  if (!authChecked) {
    return (
      <ProfileLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#029cda]" />
        </div>
      </ProfileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <ProfileLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#313131] mb-4">Необходима авторизация</h1>
            <p className="text-gray-600 mb-6">Для доступа к личному кабинету необходимо войти в систему</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
              className="px-6 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  if (!profile) {
    return (
      <ProfileLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#029cda] mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#e8eaed] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#313131]">Личный кабинет</h1>
              <button
                onClick={async () => { await authStore.signOut(); window.location.href = '/'; }}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Выйти
              </button>
            </div>

            {/* Аватар */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative group">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Аватар"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#e0f2fd] flex items-center justify-center text-[#029cda]">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                >
                  {avatarUploading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <div className="font-semibold text-[#313131] text-lg">{profile.full_name || profile.email}</div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="mt-1 text-sm text-[#029cda] hover:underline"
                >
                  {profile.avatar_url ? 'Изменить фото' : 'Загрузить фото'}
                </button>
              </div>
            </div>

            {/* Информация о профиле */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 font-[Raleway] font-medium lining-nums">
              <div>
                <h2 className="text-lg font-semibold text-[#313131] mb-4">Личная информация</h2>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя</label>
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#029cda] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Организация</label>
                      <input
                        type="text"
                        value={editData.organization}
                        onChange={(e) => setEditData({...editData, organization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#029cda] focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveProfile} className="px-4 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors">Сохранить</button>
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Имя:</span>
                      <p className="text-[#313131]">{profile.full_name || 'Не указано'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <p className="text-[#313131]">{profile.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Организация:</span>
                      <p className="text-[#313131]">{profile.organization || 'Не указана'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Роль:</span>
                      <p className="text-[#313131]">
                        {profile.role === 'admin' ? 'Администратор' :
                         profile.role === 'author' ? 'Редактор' : 'Пользователь'}
                      </p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors">Редактировать</button>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#313131] mb-4">Статистика</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Избранных статей:</span>
                    <span className="font-semibold text-gray-600">{favoritePosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Дата регистрации:</span>
                    <span className="font-semibold text-gray-600">{new Date(profile.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Заявка на роль редактора */}
            {profile.role === 'user' && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-[#313131] mb-4">Стать редактором</h2>
                <p className="text-gray-600 mb-4">Хотите писать статьи для нашего блога? Подайте заявку на получение роли редактора.</p>
                {isRequestingAuthorRole ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Расскажите о себе и вашей организации</label>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#029cda] focus:border-transparent"
                        placeholder="Опишите ваш опыт работы, сферу деятельности организации и почему вы хотите стать редактором..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleRequestAuthorRole} className="px-4 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors">Отправить заявку</button>
                      <button onClick={() => setIsRequestingAuthorRole(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setIsRequestingAuthorRole(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Подать заявку на роль редактора</button>
                )}
              </div>
            )}
          </div>

          {/* Избранные статьи */}
          <div className="bg-white rounded-2xl border border-[#e8eaed] p-6">
            <h2 className="text-lg font-semibold text-[#313131] mb-4">Избранные статьи</h2>
            {favoritePosts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">У вас пока нет избранных статей</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoritePosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    {post.cover && (
                      <div className="aspect-video mb-3 rounded-lg overflow-hidden">
                        <Image src={post.cover} alt={post.title} width={300} height={200} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-semibold text-[#313131] mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString('ru-RU')}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* СМИ о нас — для редакторов и админов */}
          {(profile.role === 'author' || profile.role === 'admin') && (
            <div className="bg-white rounded-2xl border border-[#e8eaed] p-6 mt-6">
              <PressAdmin />
            </div>
          )}

          {/* Заказ услуг */}
          <div className="bg-white rounded-2xl border border-[#e8eaed] p-6 mt-6">
            <h2 className="text-lg font-semibold text-[#313131] mb-4">Заказать услуги</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-[#313131] mb-2">Платформа "Единая среда"</h3>
                <p className="text-gray-600 text-sm mb-4">Получите доступ к цифровой платформе для управления территориями</p>
                <button className="w-full px-4 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors">Заказать платформу</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-[#313131] mb-2">Консультационные услуги</h3>
                <p className="text-gray-600 text-sm mb-4">Получите консультацию по внедрению и использованию платформы</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Заказать консультацию</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
