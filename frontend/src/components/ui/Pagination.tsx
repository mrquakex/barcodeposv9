import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  className?: string;
}

/**
 * Fluent Design-compatible Pagination Component
 * Used across the application for consistent pagination UI
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info Text */}
      {itemsPerPage && totalItems && (
        <div className="text-sm text-foreground-secondary">
          Toplam <span className="font-semibold text-foreground">{totalItems}</span> kayıt, 
          Sayfa <span className="font-semibold text-foreground">{currentPage}</span> / <span className="font-semibold text-foreground">{totalPages}</span>
        </div>
      )}

      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${currentPage === 1
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-foreground hover:bg-surface-secondary active:bg-surface-tertiary'
            }
          `}
          aria-label="Önceki Sayfa"
        >
          ‹
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            // Show ellipsis
            const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
            const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

            if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
              return null;
            }

            if (showEllipsisBefore || showEllipsisAfter) {
              return (
                <span
                  key={`ellipsis-${page}`}
                  className="px-2 text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`
                  min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all
                  ${page === currentPage
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-foreground hover:bg-surface-secondary active:bg-surface-tertiary'
                  }
                `}
                aria-label={`Sayfa ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${currentPage === totalPages
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-foreground hover:bg-surface-secondary active:bg-surface-tertiary'
            }
          `}
          aria-label="Sonraki Sayfa"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;

