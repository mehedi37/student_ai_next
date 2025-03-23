'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const allThemes = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter'
];

const ThemeContext = createContext({
  theme: 'bumblebee',
  setTheme: () => {},
  themes: allThemes
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('bumblebee');
  const themes = allThemes;

  // Initialize theme from localStorage on client side
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes.includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Update theme in localStorage and HTML attribute
  const changeTheme = (newTheme) => {
    if (themes.includes(newTheme)) {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
