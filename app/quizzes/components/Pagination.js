'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Always show first page
    if (startPage > 1) {
      buttons.push(
        <button
          key="1"
          onClick={() => onPageChange(1)}
          className="join-item btn btn-sm"
        >
          1
        </button>
      );

      if (startPage > 2) {
        buttons.push(
          <button key="ellipsis1" className="join-item btn btn-sm btn-disabled">...</button>
        );
      }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`join-item btn btn-sm ${currentPage === i ? 'btn-primary' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <button key="ellipsis2" className="join-item btn btn-sm btn-disabled">...</button>
        );
      }

      buttons.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`join-item btn btn-sm ${currentPage === totalPages ? 'btn-primary' : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="join">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="join-item btn btn-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {renderPageButtons()}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="join-item btn btn-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}