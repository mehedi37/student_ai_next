'use client';

import { useTheme } from '@/components/context/ThemeContext';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher({ showText = true }) {
  const { theme, setTheme, themes } = useTheme();

  // Group themes into categories
  const popularThemes = ['light', 'dark', 'cupcake', 'corporate', 'synthwave', 'retro', 'cyberpunk'];
  const otherThemes = themes.filter(t => !popularThemes.includes(t));

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        <Palette className="h-4 w-4" />
        {showText && <span className="ml-1">Theme</span>}
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 max-h-96 overflow-y-auto">
        <li className="menu-title text-xs">Popular</li>
        {popularThemes.map((t) => (
          <li key={t}>
            <button
              className={theme === t ? 'active' : ''}
              onClick={() => setTheme(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          </li>
        ))}

        <li className="menu-title text-xs pt-2">More Themes</li>
        {otherThemes.map((t) => (
          <li key={t}>
            <button
              className={theme === t ? 'active' : ''}
              onClick={() => setTheme(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
