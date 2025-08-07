import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationWrapper({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationWrapperProps) {
  // Helper to generate page numbers with ellipsis (simple version)
  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 7) {
      return [...Array(totalPages).keys()].map((i) => i + 1);
    }

    const pages = [1];

    if (currentPage > 4) {
      pages.push(-1); // Ellipsis
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push(-1); // Ellipsis
    }

    pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  return (
    <Pagination aria-label="Pagination Navigation" className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>

        {pageNumbers.map((page, idx) =>
          page === -1 ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink 
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  if (page !== currentPage) onPageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            aria-disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
