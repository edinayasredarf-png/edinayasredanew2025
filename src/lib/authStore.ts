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
      this.user = session?.user || null;
      if (this.user) {
        await this.loadProfile();
      } else {
        this.profile = null;
      }
      this.notifyListeners();
    });

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

      this.profile = data || {
        id: this.user.id,
        email: this.user.email || '',
        full_name: this.user.user_metadata?.full_name || '',
        avatar_url: this.user.user_metadata?.avatar_url || '',
        organization: '',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Profile load error:', error);
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
    return this.hasRole('author') || this.hasRole('admin');
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

  async signInWithProvider(provider: 'google') {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not initialized');

    const { data, error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
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
