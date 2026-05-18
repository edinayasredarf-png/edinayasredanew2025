'use client';

import { getSupabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import { dataFetch } from './dataApi';

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

// Auth state management
export class AuthStore {
  private user: User | null = null;
  private profile: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    const sb = getSupabase();
    if (!sb) return;

    // Get initial session
    const { data: { session } } = await sb.auth.getSession();
    this.user = session?.user || null;
    
    if (this.user) {
      await this.loadProfile();
    }

    // Listen for auth changes
    sb.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      this.user = session?.user || null;
      if (this.user) {
        await this.loadProfile();
      } else {
        this.profile = null;
      }
      this.notifyListeners();
    });

    // Listen for page visibility changes to refresh session
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          console.log('Page became visible, refreshing session...');
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user && !this.user) {
            console.log('Session refreshed, user found:', session.user.id);
            this.user = session.user;
            await this.loadProfile();
            this.notifyListeners();
          }
        }
      });

      // Also listen for focus events
      window.addEventListener('focus', async () => {
        console.log('Window focused, checking session...');
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user && !this.user) {
          console.log('Session found on focus:', session.user.id);
          this.user = session.user;
          await this.loadProfile();
          this.notifyListeners();
        }
      });
    }

    this.notifyListeners();
  }

  private async loadProfile() {
    if (!this.user) return;

    try {
      let data = (await dataFetch("/profile")) as UserProfile | null;
      if (!data) {
        await this.createProfile();
        return;
      }
      if (this.user.email === "proeco09@yandex.ru" && data.role !== "admin") {
        console.log("Updating editor role for:", this.user.email);
        await this.updateEditorRole();
        return;
      }
      this.profile = data;
    } catch (error) {
      console.error("Profile load error:", error);
    }
  }

  private async createProfile() {
    if (!this.user) return;

    try {
      await dataFetch("/profile", { method: "POST" });
      let data = (await dataFetch("/profile")) as UserProfile;
      if (this.user.email === "proeco09@yandex.ru" && data.role !== "admin") {
        await dataFetch("/profile", {
          method: "PATCH",
          body: JSON.stringify({ role: "admin" }),
        });
        data = (await dataFetch("/profile")) as UserProfile;
      }
      this.profile = data;
      this.notifyListeners();
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  }

  private async updateEditorRole() {
    if (!this.user) return;

    try {
      await dataFetch("/profile", {
        method: "PATCH",
        body: JSON.stringify({ role: "admin" }),
      });
      this.profile = (await dataFetch("/profile")) as UserProfile;
      console.log("Editor role updated successfully");
      this.notifyListeners();
    } catch (error) {
      console.error("Error updating editor role:", error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Public API
  getCurrentUser(): User | null {
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
    const canWrite = this.hasRole('author') || this.hasRole('admin');
    console.log('canWriteArticles check:', {
      profile: this.profile,
      role: this.profile?.role,
      canWrite
    });
    return canWrite;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Auth methods
  async signInWithEmail(email: string, password: string) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signUpWithEmail(email: string, password: string, fullName?: string) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async signInWithProvider(provider: 'google' | 'yandex' | 'vk') {
    // Для Google используем Supabase OAuth
    if (provider === 'google') {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase not initialized');

      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    }

    // Для Яндекс и ВК используем кастомную OAuth реализацию
    if (provider === 'yandex' || provider === 'vk') {
      const { initiateOAuth } = await import('./oauth');
      initiateOAuth(provider);
      // initiateOAuth перенаправляет пользователя, поэтому мы не возвращаем данные здесь
      return { url: null };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  async signUpWithPhone(phone: string) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    // Нормализуем номер телефона (убираем пробелы, скобки и т.д.)
    const normalizedPhone = phone.replace(/\s|\(|\)|-/g, '');

    const { data, error } = await sb.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) throw error;
    return data;
  }

  async verifyPhoneOTP(phone: string, token: string) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    // Нормализуем номер телефона
    const normalizedPhone = phone.replace(/\s|\(|\)|-/g, '');

    const { data, error } = await sb.auth.verifyOtp({
      phone: normalizedPhone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    
    // После успешной верификации загружаем профиль
    if (data.user) {
      this.user = data.user;
      await this.loadProfile();
      this.notifyListeners();
    }
    
    return data;
  }

  async signOut() {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    const { error } = await sb.auth.signOut();
    if (error) throw error;
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

// Global auth store instance
export const authStore = new AuthStore();
