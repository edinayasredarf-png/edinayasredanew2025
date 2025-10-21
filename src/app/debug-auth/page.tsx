'use client';

import { useEffect, useState } from 'react';
import { authStore } from '@/lib/authStore';

export default function DebugAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      const user = authStore.getCurrentUser();
      const profile = authStore.getCurrentProfile();
      const isAuth = authStore.isAuthenticated();
      const isEditor = authStore.canWriteArticles();
      
      setUser(user);
      setProfile(profile);
      setIsAuth(isAuth);
      setIsEditor(isEditor);
    });

    // Initial load
    const user = authStore.getCurrentUser();
    const profile = authStore.getCurrentProfile();
    const isAuth = authStore.isAuthenticated();
    const isEditor = authStore.canWriteArticles();
    
    setUser(user);
    setProfile(profile);
    setIsAuth(isAuth);
    setIsEditor(isEditor);

    return unsubscribe;
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">User:</h2>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Profile:</h2>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Status:</h2>
          <p>Authenticated: {isAuth ? 'Yes' : 'No'}</p>
          <p>Can Write Articles: {isEditor ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}
