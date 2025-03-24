'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import Link from 'next/link';
import {
  BookOpen,
  Brain,
  MessageSquare,
  Upload,
  Lightbulb,
  FileText,
  ArrowRight,
  Github,
  Linkedin,
} from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className={`navbar fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-base-100/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="navbar-start">
            <div className="flex items-center">
              <div className="avatar-placeholder">
                <div className="w-10 rounded-full bg-primary text-primary-content grid place-items-center">
                  <span className="text-xl font-bold">AI</span>
                </div>
              </div>
              <span className="ml-2 text-xl font-bold">Student AI</span>
              <div className="navbar-center hidden lg:flex ml-4">
                <ul className="menu menu-horizontal px-1">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="navbar-end">
                  <ThemeSwitcher />
                <Link href="/auth" className="btn btn-primary">Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>


        </div>
      </div>

      {/* Hero Section */}
      <section className="hero min-h-screen bg-gradient-to-b from-base-200 to-base-100 pt-24">
        <div className="hero-content flex-col lg:flex-row-reverse container mx-auto px-4">
          <div className="mockup-browser border bg-base-300 flex-1 shadow-lg max-w-xl">
            <div className="mockup-browser-toolbar">
              <div className="input">student-ai.app</div>
            </div>
            <div className="flex flex-col justify-start px-4 py-6 bg-base-200 relative min-h-[300px]">
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-primary">
                  Can you explain quantum computing in simple terms?
                </div>
              </div>
              <div className="chat chat-end mt-4">
                <div className="chat-bubble">
                  Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits.
                </div>
              </div>
              <div className="chat chat-start mt-4">
                <div className="chat-bubble chat-bubble-primary">
                  What makes it more powerful?
                </div>
              </div>
              <div className="chat chat-end mt-4 animate-pulse">
                <div className="chat-bubble">
                  The power comes from quantum properties like...
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold">Your Learning Assistant</h1>
            <p className="py-6 text-base-content/80">
              Upload your study materials, ask questions, and get instant, personalized explanations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth" className="btn btn-primary">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <a href="#features" className="btn btn-outline">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Features</h2>
            <p className="text-base-content/70 max-w-lg mx-auto">
              Tools to help you learn more effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-base-200 hover:shadow-md transition-all">
              <div className="card-body">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">Upload Materials</h3>
                <p className="text-base-content/70">Upload PDFs, documents, or YouTube links to study with AI.</p>
              </div>
            </div>

            <div className="card bg-base-200 hover:shadow-md transition-all">
              <div className="card-body">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">Interactive Chats</h3>
                <p className="text-base-content/70">Have conversations about your materials and get clear explanations.</p>
              </div>
            </div>

            <div className="card bg-base-200 hover:shadow-md transition-all">
              <div className="card-body">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">Smart Processing</h3>
                <p className="text-base-content/70">AI analyzes your content to provide relevant and accurate answers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-base-content/70 max-w-lg mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <div className="badge badge-primary badge-lg mb-3">1</div>
                <h3 className="card-title text-lg">Create Account</h3>
                <p className="text-base-content/70">Sign up for free and set up your account.</p>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <div className="badge badge-primary badge-lg mb-3">2</div>
                <h3 className="card-title text-lg">Upload Materials</h3>
                <p className="text-base-content/70">Add your study materials or YouTube links.</p>
              </div>
            </div>

            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <div className="badge badge-primary badge-lg mb-3">3</div>
                <h3 className="card-title text-lg">Start Learning</h3>
                <p className="text-base-content/70">Ask questions and get personalized help.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/auth" className="btn btn-primary">
              Start Now
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-content">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Learning?</h2>
          <p className="mb-6">
            Get started with Student AI today.
          </p>
          <Link href="/auth" className="btn bg-primary-content text-primary hover:bg-primary-content/90">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <div className="avatar-placeholder">
            <div className="w-14 rounded-full bg-primary text-primary-content grid place-items-center">
              <span className="text-xl font-bold">AI</span>
            </div>
          </div>
          <p className="font-semibold mt-2">Student AI</p>
          <p className="text-sm text-base-content/70">A simple AI-powered learning assistant by HattiMatim_Team</p>
        </div>
        <div>
          <div className="grid grid-flow-col gap-4">
            <Link href="https://github.com/mehedi37/student_ai_next" className="btn btn-ghost btn-circle" target="_blank">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="https://www.linkedin.com/in/mehedi-hasanmaruf" className="btn btn-ghost btn-circle" target='_blank'>
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm text-base-content/60">© 2025 Student AI - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

