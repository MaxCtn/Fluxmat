'use client';

import { useState, useEffect, useRef } from 'react';
import SortableHeader, { SortDirection } from './SortableHeader';

type CodeDechetFilter = 'all' | 'with' | 'without';

interface FilterableCodeDechetHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection } | null;
  onSort: (key: string) => void;
  filterValue: CodeDechetFilter;
  onFilterChange: (filter: CodeDechetFilter) => void;
  className?: string;
}

/**
 * Composant d'en-tête avec tri ET filtre pour le code déchet
 * Affiche une flèche de tri + un menu déroulant pour filtrer (tous / avec code / sans code)
 */
export default function FilterableCodeDechetHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort,
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
    e.stopPropagation(); // Empêcher le tri quand on clique sur le filtre
    setShowFilter(!showFilter);
  };

  return (
    <th 
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors relative ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          {/* Flèche de tri */}
          <div className="flex flex-col text-[10px] leading-none" onClick={(e) => e.stopPropagation()}>
            {currentSort?.key === sortKey ? (
              currentSort.direction === 'asc' ? (
                <span className="text-blue-600">▲</span>
              ) : currentSort.direction === 'desc' ? (
                <span className="text-blue-600">▼</span>
              ) : (
                <span className="text-gray-300">▲</span>
              )
            ) : (
              <span className="text-gray-300">▲</span>
            )}
          </div>
          
          {/* Icône de filtre */}
          <div className="relative" ref={filterRef} onClick={handleFilterClick}>
            <button
              className="text-gray-400 hover:text-gray-600 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowFilter(!showFilter);
              }}
              title="Filtrer"
            >
              🔽
            </button>
            
            {/* Menu déroulant du filtre */}
            {showFilter && (
              <div 
                className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[140px]"
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
                  Tous
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
                  Avec code
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
                  Sans code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </th>
  );
}

export type { CodeDechetFilter };

