'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-center">
        <h1 className="text-4xl font-bold mb-8">Student AI Assistant</h1>
        <p className="text-xl mb-8">
          Your intelligent learning companion
        </p>

        <div className="flex gap-4 justify-center">
          {!user && !isLoading ? (
            <>
              <Link href="/auth/login"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Login
              </Link>
              <Link href="/auth/register"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Register
              </Link>
            </>
          ) : isLoading ? (
            <p>Loading...</p>
          ) : (
            <Link href="/dashboard"
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
