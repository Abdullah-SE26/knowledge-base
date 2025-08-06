'use client';

import dynamic from 'next/dynamic';

// Dynamically import the actual client component with ssr disabled
const AdminArticlesManager = dynamic(() => import('./AdminArticlesManager'), {
  ssr: false,
});

export default function AdminArticlesManagerWrapper() {
  return <AdminArticlesManager />;
}
