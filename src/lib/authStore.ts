'use client';

import { getSupabase } from './supabase';
import type { User } from '@supabase/supabase-js';

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
    
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data, error } = await sb
        .from('user_profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load profile:', error);
        return;
      }

      // Check if this is the editor email and update role if needed
      if (this.user.email === 'proeco09@yandex.ru' && data && data.role !== 'admin') {
        console.log('Updating editor role for:', this.user.email);
        await this.updateEditorRole();
        return;
      }

      this.profile = data || {
        id: this.user.id,
        email: this.user.email || '',
        full_name: this.user.user_metadata?.full_name || '',
        avatar_url: this.user.user_metadata?.avatar_url || '',
        organization: '',
        role: this.user.email === 'proeco09@yandex.ru' ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If profile doesn't exist, create it
      if (!data && error?.code === 'PGRST116') {
        await this.createProfile();
      }
    } catch (error) {
      console.error('Profile load error:', error);
    }
  }

  private async createProfile() {
    if (!this.user) return;

    const sb = getSupabase();
    if (!sb) return;

    try {
      const isEditor = this.user.email === 'proeco09@yandex.ru';
      
      const { data, error } = await sb
        .from('user_profiles')
        .insert({
          id: this.user.id,
          email: this.user.email || '',
          full_name: this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || 'Пользователь',
          role: isEditor ? 'admin' : 'user',
          avatar_url: this.user.user_metadata?.avatar_url,
        })
        .select()
        .single();

      if (error) throw error;
      this.profile = data;
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  }

  private async updateEditorRole() {
    if (!this.user) return;

    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data, error } = await sb
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', this.user.id)
        .select()
        .single();

      if (error) throw error;
      this.profile = data;
      console.log('Editor role updated successfully');
    } catch (error) {
      console.error('Error updating editor role:', error);
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

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    const { data, error } = await sb
      .from('user_profiles')
      .upsert({
        ...this.profile,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    
    this.profile = data;
    this.notifyListeners();
    return data;
  }
}

// Global auth store instance
export const authStore = new AuthStore();
