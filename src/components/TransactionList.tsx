import React, { useState, useEffect, useMemo } from "react";
import { Transaction, UserPreferences } from "../types/transaction";
import { TransactionItem } from "./TransactionItems";

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions?: number;
  onTransactionClick: (transaction: Transaction) => void;
  userPreferences: UserPreferences
}

type PagesInfo = {
  currentPage: number,
  totalPages: number,
  pagination: number,
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  totalTransactions,
  onTransactionClick,
  userPreferences,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pages, setPages] = useState<PagesInfo>(
    {
      currentPage: 1,
      totalPages: 0,
      pagination: 0,
    }
  );

  const { currentPage, totalPages, pagination } = pages;

  useEffect(() => {
    // Pre-calculate formatted amounts for display optimization
    const formattedTransactions = transactions.map((t) => {
      return {
        ...t,
        formattedAmount: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(t.amount),
      };
    });

    setSelectedItems(new Set());

    if (formattedTransactions.length > 0) {
      const maxPages = Math.round(transactions?.length / userPreferences.itemsPerPage);
      setPages((prev) => ({ ...prev, totalPages: maxPages }));
  
      localStorage.setItem(
        "lastTransactionCount",
        formattedTransactions.length.toString()
      );
    }
  }, [transactions, userPreferences.itemsPerPage]);

  const handleItemClick = (transaction: Transaction) => {
    const updatedSelected = new Set(selectedItems);
    if (updatedSelected.has(transaction.id)) {
      updatedSelected.delete(transaction.id);
    } else {
      updatedSelected.add(transaction.id);
    }
    setSelectedItems(updatedSelected);
    onTransactionClick(transaction);
  };

  const handleMouseEnter = (id: string) => {
    if (hoveredItem === id) return;
    setHoveredItem(id);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  
  const sortedTransactions = transactions.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  
  // useEffect(() => {
    //   let itemsLength = transactions.length;
    //   console.log(itemsLength)
    //   let pageLength = 0;
    
    //   while (itemsLength >= 0) {
      //     itemsLength -= itemsPerPage;
      //     pageLength += 1;
      //   }
      //   setPages([...Array(pageLength)]);
      // }, [transactions])
      
  const paginatedData = useMemo(() => {
    const itemsPerPage = userPreferences.itemsPerPage;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, userPreferences.itemsPerPage]);

  // useEffect(() => {
  //   setPages((prev) => {
  //     const nextPage = prev.currentPage === totalPages ? totalPages : prev.currentPage + 1;
  //     const result = { ...prev, currentPage: nextPage };
  //     if (prev.currentPage >= 4) result.pagination += 5;
  //     return result;
  //   });
  // }, [currentPage, totalPages])

  const handlePage = (action: 'next' | 'prev', pageNumber = 1) => {
    const adjusted = pageNumber <= 1 ? pageNumber : Math.abs(currentPage - pageNumber);
    console.log({ adjusted, pageNumber })
    if (action === 'next') {
      setPages((prev) => {
        const nextPage = prev.currentPage === totalPages ? totalPages : prev.currentPage + adjusted;
        const result = { ...prev, currentPage: nextPage };
        if (nextPage >= pagination + 5) result.pagination += 5;
        return result;
      });
    } else {
      setPages((prev) => {
        const prevPage = prev.currentPage >= 2 ? prev.currentPage - adjusted : prev.currentPage;
        console.log(prevPage)
        const result = { ...prev, currentPage: prevPage };
        if (prevPage <= pagination + 1) result.pagination -= result.pagination >= 5 ? 5 : 0;
        return result;
      });
    }
  };

  console.log({ currentPage })
  const handlePageSelection = (selectedPage: number) => {
    const current = currentPage
    console.log(current)
    // if (selectedPage === 1 || selectedPage === totalPages) return;
    if (selectedPage > current) handlePage('next', selectedPage);
    else if (selectedPage <= current) handlePage('prev', selectedPage);
    return;
  }

  return (
    <div
      className="transaction-list"
      role="region"
      aria-label="Transaction list"
    >
      <div className="transaction-list-header">
        <div className="transaction-list-pagination-wrapper">  
          <h2 id="transaction-list-title">
            Transactions ({transactions.length}
            {totalTransactions && totalTransactions !== transactions.length && (
              <span> of {totalTransactions}</span>
            )}
            )
          </h2>

          <div className="transaction-list-pagination">
            {
              [...Array(totalPages).keys()].slice(pagination, pagination + 5).map((page) => (
                <span
                key={page}
                className={`${page + 1 === currentPage ? 'active' : ''}`}
                onClick={() => handlePageSelection(page + 1)}
                >{page + 1}
                </span>
              ))
            }
            <span><i>of</i> {totalPages}</span>
          </div>
        </div>
        
        <span className="total-amount" aria-live="polite">
          Total:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(transactions.reduce((sum, t) => sum + t.amount, 0))}
        </span>
      </div>

      <div
        className="transaction-list-container"
        role="grid"
        aria-labelledby="transaction-list-title"
        aria-rowcount={userPreferences.itemsPerPage}
        tabIndex={0}
      >
        {paginatedData.map((transaction, index) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            isSelected={selectedItems.has(transaction.id)}
            isHovered={hoveredItem === transaction.id}
            onClick={() => handleItemClick(transaction)}
            onMouseEnter={() => handleMouseEnter(transaction.id)}
            onMouseLeave={handleMouseLeave}
            rowIndex={index}
          />
        ))}
      </div>

      <div className="page-counter">
        <button
        onClick={() => handlePage('prev')}
        >{'<'}</button>
        <button
        onClick={() => handlePage('next')}
        >{'>'}</button>
      </div>
    </div>
  );
};