import { useEffect, useState } from 'react';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

export function useYouTubeVideos(query: string) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setVideos([]);
      return;
    }

    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch(
          `http://localhost:7001/api/youtube?query=${encodeURIComponent(query)}`
        );
        
        if (!resp.ok) {
          throw new Error('Failed to fetch YouTube videos');
        }
        
        const data = await resp.json();
        if (!data.items) {
          console.error('No items in YouTube response', data);
          setVideos([]);
        } else {
          const formatted = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
          }));
          setVideos(formatted);
        }
      } catch (err) {
        console.error('Error fetching YouTube videos:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch videos');
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchVideos();
    }, 500); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [query]);

  return { videos, isLoading, error };
}