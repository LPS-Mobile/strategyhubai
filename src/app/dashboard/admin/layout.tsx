// src/app/dashboard/admin/layout.tsx
'use client';
import { ProtectAdminRoute } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectAdminRoute>
      {children}
    </ProtectAdminRoute>
  );
}