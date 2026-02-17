'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from './navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Don't show navbar for admins OR on admin pages
  if (user?.role === 'admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return <Navbar />;
}