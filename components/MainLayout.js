'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import AuthenticatedLayout from './AuthenticatedLayout';
import UnauthenticatedLayout from './UnauthenticatedLayout';

export default function MainLayout({ children }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Check if current route is an auth page or public page
  const isAuthPage = pathname.startsWith('/auth');
  const isPublicPage = isAuthPage || pathname === '/';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If user is not authenticated and trying to access a protected route, use UnauthenticatedLayout
  // If user is authenticated or on public pages, use the appropriate layout
  if (!user && !isPublicPage) {
    // Redirect happens in the respective layout based on authentication status
    return <UnauthenticatedLayout>{children}</UnauthenticatedLayout>;
  }

  // Use the appropriate layout based on authentication status
  return user ? (
    <AuthenticatedLayout>{children}</AuthenticatedLayout>
  ) : (
    <UnauthenticatedLayout>{children}</UnauthenticatedLayout>
  );
}