import { useCallback, useState } from "react"
import { IntersectingProp } from "../types/transaction"

type UseIntersectionObserverProps = {
  screenPosition: string,
  threshold?: number | number[] // not less than zero, not greater than 1
}

/**
 * @description
 * @param screenPosition
 * @param threshold (optional: defaulted to 0)
 */

export const useIntersectionObserver = (
  {
    screenPosition, threshold=0,
  }: UseIntersectionObserverProps
  ) => {
  const [intersecting, setIntersecting] = useState<IntersectingProp>(
    {
      isIntersecting: false,
      node: {} as Element,
    }
  )

  const observerRef = useCallback((node: HTMLElement) => {
    const observer = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting) setIntersecting(
        {
          isIntersecting: true,
          node: entries[0].target,
        }
      )
      else setIntersecting(
        {
          isIntersecting: false,
          node: {} as Element,
        }
      );
    },{ rootMargin: screenPosition, threshold: threshold })
    if(node) observer.observe(node)
  }, [screenPosition, threshold])

  return { intersecting, observerRef }
}