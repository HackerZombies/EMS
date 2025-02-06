// src/components/ui/CustomPagination.tsx
"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  // PaginationEllipsis, // Uncomment if you plan to use ellipsis for many pages.
} from "@/components/ui/pagination";

export interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // For simplicity, we'll show all pages.
  // If you have many pages, you might want to conditionally render ellipsis.
  const pages = [];
  for (let page = 1; page <= totalPages; page++) {
    pages.push(
      <PaginationItem key={page}>
        <PaginationLink
          isActive={page === currentPage}
          // Prevent default behavior so the link doesn't reload the page.
          onClick={(e) => {
            e.preventDefault();
            onPageChange(page);
          }}
          href="#"
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            href="#"
          />
        </PaginationItem>
        {pages}
        <PaginationItem>
          <PaginationNext
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            href="#"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default CustomPagination;
