import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/context/AuthContext';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { TaskProgressProvider } from '@/app/components/TaskProgressManager';
import MainLayout from '@/components/MainLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Student AI Learning Assistant',
  description: 'AI-powered learning assistant for students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TaskProgressProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </TaskProgressProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
