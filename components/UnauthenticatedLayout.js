'use client';

import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';

export default function UnauthenticatedLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="navbar bg-base-200 shadow-sm z-20">
        <div className="navbar-start">

          <Link href="/" className="btn btn-ghost text-xl font-bold">
            Student <div className="w-10 rounded-full bg-primary text-primary-content grid place-items-center">
            <span className="text-xl font-bold">AI</span>
          </div>
          </Link>
        </div>
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/#about">About</Link></li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <ThemeSwitcher showText={false} />
          <Link href="/auth" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-200 text-base-content">
        <div>
          <p>© {new Date().getFullYear()} Student AI - হাট্টিমাটিম_Team</p>
        </div>
      </footer>
    </div>
  );
}