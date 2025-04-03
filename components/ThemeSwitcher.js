'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeSwitcher({ showText = true }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only showing the switcher after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const themeSequence = ['bumblebee', 'dracula', 'system'];
    const currentIndex = themeSequence.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeSequence.length;
    setTheme(themeSequence[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'bumblebee':
        return <Sun className="h-5 w-5" />;
      case 'dracula':
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case 'bumblebee':
        return 'bumblebee';
      case 'dracula':
        return 'dracula';
      default:
        return 'System';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle"
      aria-label={`Switch to ${theme === 'bumblebee' ? 'dracula' : theme === 'dracula' ? 'system' : 'bumblebee'} theme`}
    >
      {getThemeIcon()}
      {showText && <span className="ml-2">{getThemeText()}</span>}
    </button>
  );
}
