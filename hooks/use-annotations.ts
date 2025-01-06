import { useState, useCallback } from 'react'
import { Annotation } from '../types/scripture'

export function useAnnotations(initialAnnotations: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    setAnnotations(prev => [...prev, {
      ...annotation,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }])
  }, [])

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  return {
    annotations,
    addAnnotation,
    removeAnnotation
  }
}

