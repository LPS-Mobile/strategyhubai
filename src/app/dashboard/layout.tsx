// src/app/dashboard/layout.tsx (Server Component)
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We use a fragment since this layout is nested inside the root layout (src/app/layout.tsx)
    <>
      <Navbar />
      
      {/* Main content area */}
      {/* pt-20 adds necessary top padding to push content below the fixed Navbar (h-16 + 4 units of space) */}
      <main className="pt-20 pb-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}