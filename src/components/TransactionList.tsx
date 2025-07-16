import React, { useState, useMemo, useCallback, ComponentType, useEffect } from "react"
import { Transaction } from "../types/transaction"
import { FixedSizeList as _FixedSizeList, FixedSizeListProps } from "react-window"
import { TransactionItem } from "./TransactionItem"
import { useIsMobile } from "../hooks/useIsMobile"

const FixedSizeList = _FixedSizeList as unknown as ComponentType<FixedSizeListProps>

interface TransactionListProps {
	transactions: Transaction[]
	totalTransactions?: number
	onTransactionClick: (transaction: Transaction) => void
}

export const TransactionList: React.FC<TransactionListProps> = ({
	transactions,
	totalTransactions,
	onTransactionClick,
}) => {
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
	const [hoveredItem, setHoveredItem] = useState<string | null>(null)

	const isMobile = useIsMobile()

	useEffect(() => {
		setSelectedItems(new Set())

		if (transactions.length > 0) {
			localStorage.setItem("lastTransactionCount", transactions.length.toString())
		}
	}, [])

	const handleItemClick = (transaction: Transaction) => {
		const updatedSelected = new Set(selectedItems)
		if (updatedSelected.has(transaction.id)) {
			updatedSelected.delete(transaction.id)
		} else {
			updatedSelected.add(transaction.id)
		}
		setSelectedItems(updatedSelected)
		onTransactionClick(transaction)
	}

	const handleMouseEnter = (id: string) => {
		setHoveredItem(id)
	}

	const handleMouseLeave = () => {
		setHoveredItem(null)
	}

	const sortedTransactions = useMemo(() => {
		return transactions.sort((a, b) => {
			return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		})
	}, [transactions])

	const sum = useMemo(() => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(transactions.reduce((sum, t) => sum + t.amount, 0))
	}, [transactions])

	const Row = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const transaction = sortedTransactions[index]
			return (
				<div style={style}>
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
				</div>
			)
		},
		[transactions, selectedItems, hoveredItem]
	)

	return (
		<div className="transaction-list" role="region" aria-label="Transaction list">
			<div className="transaction-list-header">
				<h2 id="transaction-list-title">
					Transactions ({transactions.length}
					{totalTransactions && totalTransactions !== transactions.length && (
						<span> of {totalTransactions}</span>
					)}
					)
				</h2>
				<span className="total-amount" aria-live="polite">
					Total: {sum}
				</span>
			</div>

			<div
				className="transaction-list-containe"
				role="grid"
				aria-labelledby="transaction-list-title"
				aria-rowcount={sortedTransactions.length}
				tabIndex={0}
			>
				<FixedSizeList
					height={600}
					itemCount={sortedTransactions.length}
					itemSize={isMobile ? 280 : 180}
					width={"100%"}
				>
					{Row}
				</FixedSizeList>
			</div>
		</div>
	)
}
