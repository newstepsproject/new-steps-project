import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  defaultItemsPerPage?: number;
  defaultPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  resetToFirstPage: () => void;
  getPageData: <T>(data: T[]) => T[];
}

export const usePagination = ({
  totalItems,
  defaultItemsPerPage = 20,
  defaultPage = 1,
}: UsePaginationProps): UsePaginationReturn => {
  const [currentPage, setCurrentPageState] = useState(defaultPage);
  const [itemsPerPage, setItemsPerPageState] = useState(defaultItemsPerPage);

  // Calculate derived values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  }, [startIndex, itemsPerPage, totalItems]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  // Helper functions
  const setCurrentPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPageState(validPage);
  };

  const setItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPageState(1);
  };

  const goToFirstPage = () => setCurrentPage(1);

  const goToLastPage = () => setCurrentPage(totalPages);

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetToFirstPage = () => {
    setCurrentPageState(1);
  };

  // Helper to slice data for current page
  const getPageData = <T>(data: T[]): T[] => {
    const start = startIndex;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    setCurrentPage,
    setItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    resetToFirstPage,
    getPageData,
  };
}; 