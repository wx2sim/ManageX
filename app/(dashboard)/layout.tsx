import Header from '@/components/Header';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Suspense fallback={<div className="h-[73px] w-full border-b border-pink-100/80 bg-white/85" />}>
        <Header />
      </Suspense>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
      <FloatingActionButton />
    </div>
  );
}
