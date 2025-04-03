'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch, initialValue = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Add debounce functionality to avoid excessive API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300); // Wait 300ms after typing stops before searching

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="join w-full max-w-md">
      <input
        type="text"
        placeholder="Search by topic..."
        className="input input-bordered join-item flex-1"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button
          type="button"
          className="btn join-item btn-ghost"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="btn join-item btn-primary">
        <Search className="w-5 h-5" />
      </div>
    </div>
  );
}