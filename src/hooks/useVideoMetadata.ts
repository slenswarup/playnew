// swarupplay/src/hooks/useVideoMetadata.ts
import { useState, useEffect } from 'react'
import { VideoMetadata } from '../types'

export const useVideoMetadata = (fileId: string | null | undefined) => {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // if there's no fileId, clear state and bail
    if (!fileId) {
      setMetadata(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchMetadata = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`http://localhost:7001/api/video/${fileId}`)
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to fetch video metadata')
        }
        const data = await response.json()
        setMetadata(data)
      } catch (err: any) {
        setError(err.message || 'Unknown error')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [fileId])

  return { metadata, isLoading, error }
}
