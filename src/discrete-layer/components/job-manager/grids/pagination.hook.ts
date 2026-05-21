import { useMemo, useState } from "react";

type UsePaginationProps<T> = {
  data: T[];
  itemsPerPage?: number;
};

export function usePagination<T>({
  data,
  itemsPerPage = 10,
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const paginate = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  const getPageByProperty = <
    K extends keyof T
  >(
    key: K,
    value: T[K]
  ): { page: number, index: number } | null => {
    const index = data.findIndex((item) => item[key] === value);

    if (index === -1) {
      return null;
    }

    const page = Math.floor(index / itemsPerPage) + 1;
    return {
      page,
      index
    };
  };

  return {
    currentPage,
    totalPages,
    data: paginatedData,
    paginate,
    nextPage: () => paginate(currentPage + 1),
    prevPage: () => paginate(currentPage - 1),
    getPageByProperty,
  };
}