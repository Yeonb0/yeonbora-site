import { useEffect, useState } from 'react'

const Query = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia(Query).matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const Mq = matchMedia(Query)
    const on = () => setReduced(Mq.matches)
    Mq.addEventListener('change', on)
    return () => Mq.removeEventListener('change', on)
  }, [])
  return reduced
}
