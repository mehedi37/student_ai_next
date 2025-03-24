'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  themes: [],
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [isClient, setIsClient] = useState(false);

  // These are the themes available in DaisyUI
  const themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald',
    'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine',
    'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
    'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk',
    'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'
  ];

  // Set isClient to true when the component mounts
  useEffect(() => {
    setIsClient(true);

    // Try to get theme from localStorage on client side
    const savedTheme = localStorage.getItem('theme');

    // Set theme based on saved preference or system preference
    if (savedTheme && themes.includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      localStorage.setItem('theme', defaultTheme);
    }
  }, []);

  // Apply theme to html element whenever it changes
  useEffect(() => {
    if (isClient) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, isClient]);

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
