//swarupplay/src/hooks/useRelatedVideos.ts
import { useState, useEffect } from 'react';
import { RelatedVideo } from '../types';

export const useRelatedVideos = () => {
  const [videos, setVideos] = useState<RelatedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7001/api/files?type=video', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch videos (${response.status})`);
        }

        const data = await response.json();
        console.log('📦 /api/files response payload:', JSON.stringify(data, null, 2));

         // figure out where the array actually lives:
        const filesArray: any[] = Array.isArray(data)
          ? data
          : data.files ?? data.data ?? [];

        // normalize to your RelatedVideo shape:
        const normalized: RelatedVideo[] = filesArray.map(f => ({
          id: f.id,
          name: f.name || f.file_name,
          thumbnail: f.thumbnail || f.thumbnail_url,
          duration: f.duration,
        }));

        setVideos(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { videos, isLoading, error };
};