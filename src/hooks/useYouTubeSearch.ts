import { useState } from 'react';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

export function useYouTubeSearch() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${encodeURIComponent(
          query
        )}&type=video&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch YouTube videos');
      }

      const data = await response.json();
      
      const formattedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
      }));

      setVideos(formattedVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('YouTube search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { videos, search, isLoading, error };
}