'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import {
  Menu, X, Home, Upload, BookOpen, MessageSquare, User, LogOut,
} from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Close sidebar on mobile when path changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Check if route is active
  const isActive = (path) => {
    if (path === '/') return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="drawer">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isSidebarOpen}
        onChange={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="drawer-content flex flex-col">
        {/* Header/Navbar */}
        <header className="navbar bg-base-200 shadow-sm z-20">
          <div className="navbar-start">
            <label htmlFor="main-drawer" className="btn btn-ghost btn-circle">
              <Menu className="h-6 w-6" />
            </label>
            <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
              Student <div className="w-10 rounded-full bg-primary text-primary-content grid place-items-center">
                <span className="text-xl font-bold">AI</span>
              </div>
            </Link>
          </div>
          <div className="navbar-center hidden md:flex">
            <ul className="menu menu-horizontal">
              <li><Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link></li>
              <li><Link href="/upload" className={isActive('/upload') ? 'active' : ''}>Upload</Link></li>
              <li><Link href="/quizzes" className={isActive('/quizzes') ? 'active' : ''}>Quizzes</Link></li>
              <li><Link href="/chat" className={isActive('/chat') ? 'active' : ''}>Chat</Link></li>
            </ul>
          </div>
          <div className="navbar-end gap-1">
            <ThemeSwitcher showText={false} />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar avatar-placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span>{user?.username || 'User'}</span>
                </li>
                <li><Link href="/dashboard"><Home className="h-4 w-4" /> Dashboard</Link></li>
                <li><Link href="/upload"><Upload className="h-4 w-4" /> Upload</Link></li>
                <li><Link href="/quizzes"><BookOpen className="h-4 w-4" /> Quizzes</Link></li>
                <li><Link href="/chat"><MessageSquare className="h-4 w-4" /> Chat</Link></li>
                <li className="mt-2"><button onClick={handleLogout} className="text-error"><LogOut className="h-4 w-4" /> Logout</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-30">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        <aside className="min-h-full w-80 bg-base-200 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold">Student<div className="w-10 rounded-full bg-primary text-primary-content grid place-items-center">
            <span className="text-xl font-bold">AI</span>
          </div></div>
            <label htmlFor="main-drawer" className="btn btn-ghost btn-circle drawer-button">
              <X className="h-6 w-6" />
            </label>
          </div>

          {/* User info */}
          <div className="card bg-base-100 mb-4">
            <div className="card-body p-4">
              <div className="flex gap-3 items-center">
                <div className="avatar avatar-placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-12">
                    <span>{user?.username?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold">{user?.username}</h3>
                  <p className="text-xs opacity-70">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation menu */}
          <ul className="menu menu-md bg-base-100 rounded-box">
            <li>
              <Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/chat" className={isActive('/chat') ? 'active' : ''}>
                <MessageSquare className="h-5 w-5" />
                Chat
              </Link>
            </li>
            <li>
              <Link href="/upload" className={isActive('/upload') ? 'active' : ''}>
                <Upload className="h-5 w-5" />
                Upload Documents
              </Link>
            </li>
            <li>
              <Link href="/quizzes" className={isActive('/quizzes') ? 'active' : ''}>
                <BookOpen className="h-5 w-5" />
                Quizzes
              </Link>
            </li>
          </ul>

          {/* Bottom logout button */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-error btn-block"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}