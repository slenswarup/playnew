import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Film, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Clock, HardDrive } from 'lucide-react';
import { VideoMetadata, PlayerState, RelatedVideo } from '../types';
import { useVideoMetadata } from '../hooks/useVideoMetadata';
import { useRelatedVideos } from '../hooks/useRelatedVideos';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useYouTubeVideos } from '../hooks/useYouTubeVideos';
import { formatFileSize, formatDuration } from '../utils/format';

// ... (keep all the existing interfaces)

const Watch: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const playId = params.get('play');
  const youtubeId = params.get('youtube');

  const {
    metadata,
    isLoading: metaLoading,
    error: metaError
  } = useVideoMetadata(playId);

  const { videos: driveVideos, isLoading: driveLoading } = useRelatedVideos();

  // Get search query from video title or YouTube ID
  const searchQuery = metadata?.file_name || youtubeId || '';
  const { videos: ytSuggestions, isLoading: loadingYT } = useYouTubeVideos(searchQuery);

  const handleVideoSelect = (id: string, isYoutube = false) => {
    // Force page reload when switching videos to ensure clean player state
    const url = isYoutube ? `/watch?youtube=${id}` : `/watch?play=${id}`;
    window.location.href = url;
  };

  // Handle SwarupDrive redirects
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    
    // If we're at /watch with a play parameter, we're good
    if (path === '/watch' && search.includes('play=')) {
      return;
    }
    
    // If we have a file ID but wrong path, redirect to proper watch URL
    const fileId = search.match(/play=([^&]+)/)?.[1];
    if (fileId) {
      window.location.href = `/watch?play=${fileId}`;
    }
  }, []);

  // Auto-select first video if none selected
  useEffect(() => {
    if (!driveLoading && driveVideos.length > 0 && !playId && !youtubeId) {
      handleVideoSelect(driveVideos[0].id, false);
    }
  }, [driveLoading, driveVideos, playId, youtubeId]);

  if (metaLoading) {
    return <LoadingScreen />;
  }

  if (metaError) {
    return <ErrorScreen message={metaError} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header metadata={metadata} />

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="w-full bg-black rounded-lg overflow-hidden">
            {youtubeId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
            ) : metadata && (
              <VideoPlayer metadata={metadata} />
            )}
          </div>

          {metadata && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h1 className="text-xl font-semibold mb-2">{metadata.file_name}</h1>
              <div className="text-sm text-gray-400 flex gap-4">
                <span>{formatFileSize(metadata.size)}</span>
                {metadata.duration && (
                  <span>{formatDuration(metadata.duration)}</span>
                )}
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-semibold mb-4">Your Videos</h2>
            <RelatedVideos
              videos={driveVideos}
              currentVideoId={metadata?.file_id || ''}
              onVideoSelect={(id) => handleVideoSelect(id, false)}
              isLoading={driveLoading}
            />
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 sticky top-4">
            <h2 className="font-semibold mb-4">YouTube Suggestions</h2>
            <YouTubeSuggestions
              videos={ytSuggestions}
              onSelect={(id) => handleVideoSelect(id, true)}
              isLoading={loadingYT}
            />
          </div>
        </aside>
      </main>
    </div>
  );
};

// ... (keep all the existing component implementations)

export default Watch;