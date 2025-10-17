'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

interface SearchResult {
  id: string;
  document_id: string;
  document_title: string;
  title: string;
  body: string;
  type: string;
  order: number;
  _formatted?: {
    title: string;
    body: string;
  };
}

interface SearchBarProps {
  workspaceId: string;
}

export default function SearchBar({ workspaceId }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/search?workspace_id=${workspaceId}&q=${encodeURIComponent(query)}&limit=10`);
      setResults(response.data.hits);
      setIsOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/documents/${result.document_id}?step=${result.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const highlightText = (text: string) => {
    return { __html: text || '' };
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search procedures..."
          className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}

          {!loading && results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {result.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    {result.document_title}
                  </div>
                  <div
                    className="font-medium text-gray-900 mb-1"
                    dangerouslySetInnerHTML={highlightText(
                      result._formatted?.title || result.title
                    )}
                  />
                  {result.body && (
                    <div
                      className="text-sm text-gray-600 truncate"
                      dangerouslySetInnerHTML={highlightText(
                        result._formatted?.body || result.body
                      )}
                    />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
