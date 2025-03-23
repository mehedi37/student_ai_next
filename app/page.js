'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Student AI Bot</a>
        </div>
        <div className="flex-none">
          <ThemeSwitcher />
          {!user && (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-primary m-1">Get Started</div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
                <li><Link href="/auth/login">Login</Link></li>
                <li><Link href="/auth/register">Register</Link></li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <main>
        <div className="hero min-h-[70vh] bg-base-200">
          <div className="hero-content flex-col lg:flex-row-reverse">
            <div className="mockup-browser border border-base-300 w-full max-w-lg bg-base-100">
              <div className="mockup-browser-toolbar">
                <div className="input">https://student-ai-bot.example.com</div>
              </div>
              <div className="flex flex-col px-4 py-8 bg-base-200">
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-primary">
                    What's the formula for gravitational potential energy?
                  </div>
                </div>
                <div className="chat chat-end">
                  <div className="chat-bubble chat-bubble-accent">
                    The formula for gravitational potential energy is E = mgh, where m is mass, g is gravitational acceleration, and h is height.
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">Learn with AI assistance</h1>
              <p className="py-6">Student AI Bot helps you study smarter, not harder. Ask questions, get explanations, and understand complex topics with our AI learning assistant.</p>
              <div className="flex gap-2">
                <Link href="/auth/register" className="btn btn-primary">Register</Link>
                <Link href="/auth/login" className="btn btn-accent">Login</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card bg-base-100 shadow-xl">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title">Intelligent Tutoring</h2>
                <p>Get personalized explanations for any subject with our AI-powered learning assistant.</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title">Upload Study Materials</h2>
                <p>Upload your notes, textbooks, or lectures and get AI assistance based on your materials.</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <figure className="px-10 pt-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title">Study Sessions</h2>
                <p>Track your learning progress and review previous conversations to reinforce your knowledge.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-base-200 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your learning experience?</h2>
            <p className="mb-6">Join thousands of students who are studying smarter with AI assistance.</p>
            <Link href="/auth/register" className="btn btn-primary btn-lg">Get Started for Free</Link>
          </div>
        </div>
      </main>

      <footer className="footer p-10 bg-neutral text-neutral-content">
        <div>
          <span className="footer-title">Student AI Bot</span>
          <p>Transforming education with AI<br/>since 2023</p>
        </div>
        <div>
          <span className="footer-title">Company</span>
          <a className="link link-hover">About us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Jobs</a>
        </div>
        <div>
          <span className="footer-title">Legal</span>
          <a className="link link-hover">Terms of service</a>
          <a className="link link-hover">Privacy policy</a>
          <a className="link link-hover">Cookie policy</a>
        </div>
      </footer>
    </div>
  );
}
