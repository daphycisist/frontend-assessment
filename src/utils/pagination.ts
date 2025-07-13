import { Transaction } from "../types/transaction";

export const transactionPagination = (pageNumber: number, limit: number, transactions: Transaction[]) => {
  const dataLength = +limit;
  const currentPage = +pageNumber;
  const startIndex = (currentPage * dataLength) - dataLength;
  // --------- sample for plain arrays ---------------
  const resultLength = transactions.length;
  const docs = transactions.slice(startIndex, dataLength + startIndex);

  const totalPages = Math.ceil(resultLength / dataLength);
  const pagesLeft = totalPages - currentPage;
  const returnedVal = (currentPage > totalPages) || (currentPage < 1);
  const prevPage = (currentPage === 1 || returnedVal) ? null : currentPage - 1;
  const nextPage = (currentPage === totalPages || returnedVal) ? null : currentPage + 1;

  const pageable = {
    totalDocs: docs?.length,
    limit: dataLength,
    totalPages,
    page: currentPage,
    hasNextPage: nextPage ? nextPage > 1 : false,
    hasPrevPage: prevPage ? prevPage >= 1 : false,
    pagesLeft: pagesLeft >= 0 ? pagesLeft : 0,
    prevPage,
    nextPage,
  };
  return { docs, meta: pageable };
};