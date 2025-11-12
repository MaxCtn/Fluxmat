'use client';

type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection } | null;
  onSort: (key: string) => void;
  className?: string;
}

/**
 * Composant d'en-tête de colonne avec tri (style Excel)
 * Affiche une flèche ▲ (ascendant) ou ▼ (descendant) selon l'état du tri
 * Gère le clic pour changer le sens du tri (asc → desc → null → asc)
 */
export default function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort,
  className = ''
}: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    onSort(sortKey);
  };

  return (
    <th 
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col text-[10px] leading-none">
          {direction === 'asc' ? (
            <span className="text-blue-600">▲</span>
          ) : direction === 'desc' ? (
            <span className="text-blue-600">▼</span>
          ) : (
            <span className="text-gray-300">▲</span>
          )}
        </div>
      </div>
    </th>
  );
}

export type { SortDirection };


