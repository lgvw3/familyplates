import { useState, useCallback } from 'react'
import { Annotation } from '../types/scripture'

export function useAnnotations(initialAnnotations: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation])
  }, [])

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a._id !== id))
  }, [])

  return {
    annotations,
    addAnnotation,
    removeAnnotation
  }
}

