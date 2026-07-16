import { Suspense } from 'react';
import { BlogHeader } from '@/components/redesign/BlogHeader';
import AdminPanel from '@/components/admin/AdminPanel';

export default function AdminPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense>
        <BlogHeader />
      </Suspense>
      <AdminPanel />
    </div>
  );
}
