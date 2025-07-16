import { useCallback, useEffect, useRef } from "react"

export function useDebouncer<T extends (...args: any[]) => any>(
	effect: T,
	delay: number
): (...args: Parameters<T>) => any {
	const timeoutId = useRef<ReturnType<typeof setTimeout>>(undefined)

	useEffect(() => {
		return () => {
			clearTimeout(timeoutId.current)
		}
	}, [])

	const debouncedEffect = useCallback(
		(...args: Parameters<T>) => {
			clearTimeout(timeoutId.current)
			timeoutId.current = setTimeout(() => {
				effect(...args)
			}, delay)
		},
		[effect, delay]
	)

	return debouncedEffect
}
