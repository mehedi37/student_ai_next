import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/context/AuthContext';
import { ThemeProvider } from '@/components/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Student AI Bot',
  description: 'AI assistant for students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
