"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Alt key for navigation shortcuts
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            router.push('/admin/dashboard');
            break;
          case 'p':
            e.preventDefault();
            router.push('/admin/purchasing');
            break;
          case 'c':
            e.preventDefault();
            router.push('/admin/costing');
            break;
          case 'o':
            e.preventDefault();
            router.push('/admin/orders');
            break;
          case 's':
            e.preventDefault();
            router.push('/admin/shops');
            break;
          case 'q': // logout
            e.preventDefault();
            void signOut({ callbackUrl: '/login' });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
