import { useState, useEffect, useCallback } from 'react'

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function useDebouncedCallback(callback, delay) {
  const [timeoutId, setTimeoutId] = useState(null)

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutId) clearTimeout(timeoutId)
      const id = setTimeout(() => callback(...args), delay)
      setTimeoutId(id)
    },
    [callback, delay]
  )

  useEffect(() => () => timeoutId && clearTimeout(timeoutId), [timeoutId])

  return debouncedCallback
}
