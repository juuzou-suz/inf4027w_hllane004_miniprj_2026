'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from './navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Keep the admin experience distraction-free (no customer navigation chrome)
  if (user?.role === 'admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return <Navbar />;
}