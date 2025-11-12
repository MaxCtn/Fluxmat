'use client';

import { useState, useEffect, useRef } from 'react';

type CodeDechetFilter = 'all' | 'with' | 'without';

interface FilterableCodeDechetHeaderProps {
  label: string;
  filterValue: CodeDechetFilter;
  onFilterChange: (filter: CodeDechetFilter) => void;
  className?: string;
}

/**
 * Composant d'en-tête avec filtre uniquement pour le code déchet
 * Affiche uniquement un menu déroulant pour filtrer (tous / avec code / sans code)
 */
export default function FilterableCodeDechetHeader({ 
  label, 
  filterValue,
  onFilterChange,
  className = ''
}: FilterableCodeDechetHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  const handleFilterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilter(!showFilter);
  };

  const getFilterIcon = () => {
    if (filterValue === 'with') return '✅';
    if (filterValue === 'without') return '❌';
    return '⚪';
  };

  return (
    <th 
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none transition-colors relative ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <div className="relative" ref={filterRef}>
          <button
            onClick={handleFilterClick}
            className={`p-1 rounded-full text-xs transition-colors ${
              filterValue !== 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Filtrer par code déchet"
          >
            {getFilterIcon()}
          </button>
          
          {/* Menu déroulant du filtre */}
          {showFilter && (
            <div 
              className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                  filterValue === 'all' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                }`}
                onClick={() => {
                  onFilterChange('all');
                  setShowFilter(false);
                }}
              >
                ⚪ Tous
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                  filterValue === 'with' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                }`}
                onClick={() => {
                  onFilterChange('with');
                  setShowFilter(false);
                }}
              >
                ✅ Avec code
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 rounded-b-md ${
                  filterValue === 'without' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                }`}
                onClick={() => {
                  onFilterChange('without');
                  setShowFilter(false);
                }}
              >
                ❌ Sans code
              </button>
            </div>
          )}
        </div>
      </div>
    </th>
  );
}

export type { CodeDechetFilter };

