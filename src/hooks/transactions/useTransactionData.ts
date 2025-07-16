import { useState, useEffect } from "react"
import { Transaction, TransactionSummary } from "../../types/transaction"
import { useWorker } from "../useWorker"
import { startDataRefresh, stopDataRefresh } from "../../utils/dataGenerator"
import { FilterOptions } from "../../types/transaction"
import { useUserContext } from "../useUserContext"
import { UserPreference } from "../../types/user"

export function useTransactionData() {
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [summary, setSummary] = useState<TransactionSummary | null>(null)
	const [loading, setLoading] = useState<boolean>(true)
	const {
		generateTransactionData,
		calculateSummary,
		generateRiskAssessment,
		searchTransactions,
		getFilteredTransactions,
	} = useWorker()

	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true)

			const initialData = await generateTransactionData(10000)
			setTransactions(initialData)

			const calculatedSummary = await calculateSummary(initialData)
			setSummary(calculatedSummary)

			if (initialData.length > 0) {
				// Run risk assessment for fraud detection compliance
				if (initialData.length > 1000) {
					console.log("Starting risk assessment...")
					const metrics = await generateRiskAssessment(initialData.slice(0, 1000))
					console.log("Risk assessment completed:", metrics.processingTime + "ms")
				}
			}

			setLoading(false)
		}
		loadInitialData()
	}, [])

	useEffect(() => {
		startDataRefresh(async () => {
			const newData = await generateTransactionData(200)
			setTransactions((currentTransactions) => {
				return currentTransactions.concat(newData)
			})
		})

		return () => stopDataRefresh()
	}, [])

	const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

	const [filters, setFilters] = useState<FilterOptions>({
		type: "all",
		status: "all",
		category: "",
		searchTerm: "",
	})
	const { userPreferences, updateUserPreferences } = useUserContext()

	const applyFilters = async (
		data: Transaction[],
		currentFilters: FilterOptions,
		userPreferences: UserPreference
	) => {
		const filteredTransactions = await getFilteredTransactions(
			data,
			currentFilters,
			userPreferences
		)
		setFilteredTransactions(filteredTransactions)
		updateUserPreferences()
	}

	function clearFilters() {
		setFilters({
			type: "all",
			status: "all",
			category: "",
			searchTerm: "",
		})
	}

	useEffect(() => {
		applyFilters(transactions, filters, userPreferences)
	}, [transactions, filters])

	useEffect(() => {
		const handleResize = async () => {
			const newSummary = await calculateSummary(filteredTransactions)
			setSummary(newSummary)
		}

		const handleScroll = () => {
			console.log("Scrolling...", new Date().toISOString())
		}

		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "f") {
				e.preventDefault()
				const searchResults = await searchTransactions(transactions, "search")
				setFilteredTransactions(searchResults)
			}
		}

		window.addEventListener("resize", handleResize)
		window.addEventListener("scroll", handleScroll)
		window.addEventListener("keydown", handleKeyDown)

		return () => {
			window.removeEventListener("resize", handleResize)
			window.removeEventListener("scroll", handleScroll)
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [transactions, filteredTransactions])

	return {
		transactions,
		summary,
		setSummary,
		loading,
		filteredTransactions,
		filters,
		setFilters,
		clearFilters,
	}
}
