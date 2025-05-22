import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Film, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Clock, HardDrive } from 'lucide-react';
import { VideoMetadata, PlayerState, RelatedVideo } from '../types';
import { useVideoMetadata } from '../hooks/useVideoMetadata';
import { useRelatedVideos } from '../hooks/useRelatedVideos';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useYouTubeVideos } from '../hooks/useYouTubeVideos';
import { formatFileSize, formatDuration } from '../utils/format';

interface HeaderProps {
  metadata: VideoMetadata | null;
}

interface PlayerControlsProps {
  playerState: PlayerState;
  togglePlay: () => void;
  handleVolumeChange: (value: number) => void;
  toggleMute: () => void;
  handleSeek: (value: number) => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
}

interface RelatedVideosProps {
  videos: RelatedVideo[];
  currentVideoId: string;
  onVideoSelect: (videoId: string) => void;
  isLoading: boolean;
}

interface VideoPlayerProps {
  metadata: VideoMetadata;
  youtubeId?: string | null;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

interface Props {
  videos: YouTubeVideo[];
  onSelect: (videoId: string) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ metadata }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <header className="bg-gray-800 shadow-md py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">SwarupPlay</h1>
        </div>
        
        {metadata && (
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-gray-300">
              <span className="font-medium text-white">{metadata.file_name}</span>
              {metadata.size && (
                <span className="ml-2 text-sm text-gray-400">
                  ({formatFileSize(metadata.size)})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 w-full h-full rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-300 border-l-transparent animate-spin"></div>
      </div>
      <p className="mt-6 text-xl text-gray-300">Loading video...</p>
    </div>
  );
};

export const ErrorScreen: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-red-500 text-xl mb-4">Error</div>
      <p>{message}</p>
    </div>
  );
};

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  togglePlay,
  handleVolumeChange,
  toggleMute,
  handleSeek,
  toggleFullscreen,
  setPlaybackRate
}) => {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showPlaybackRates, setShowPlaybackRates] = useState(false);
  let hideControlsTimeout: number;

  useEffect(() => {
    resetHideControlsTimer();
    return () => clearTimeout(hideControlsTimeout);
  }, [playerState.isPlaying]);

  const resetHideControlsTimer = () => {
    clearTimeout(hideControlsTimeout);
    setIsControlsVisible(true);
    
    if (playerState.isPlaying) {
      hideControlsTimeout = window.setTimeout(() => {
        setIsControlsVisible(false);
        setShowPlaybackRates(false);
      }, 3000);
    }
  };

  const handleMouseMove = () => {
    resetHideControlsTimer();
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
      onMouseMove={handleMouseMove}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={playerState.duration || 100}
          value={playerState.currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:w-4 [&::-webkit-slider-thumb]:hover:h-4 [&::-webkit-slider-thumb]:transition-all"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={togglePlay} 
            className="text-white hover:text-purple-400 transition"
          >
            {playerState.isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </button>
          
          <button 
            onClick={() => handleSeek(playerState.currentTime - 10)}
            className="text-white hover:text-purple-400 transition"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => handleSeek(playerState.currentTime + 10)}
            className="text-white hover:text-purple-400 transition"
          >
            <SkipForward className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-purple-400 transition"
            >
              {playerState.isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={playerState.isMuted ? 0 : playerState.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          
          <div className="text-white text-sm">
            <span>{formatTime(playerState.currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowPlaybackRates(!showPlaybackRates)}
              className="text-white hover:text-purple-400 px-2 py-1 rounded text-sm border border-gray-700 hover:border-purple-400 transition"
            >
              {playerState.playbackRate}x
            </button>
            
            {showPlaybackRates && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded shadow-lg overflow-hidden z-10">
                {playbackRates.map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowPlaybackRates(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      playerState.playbackRate === rate 
                        ? 'bg-purple-600 text-white' 
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-purple-400 transition"
          >
            <Maximize className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const RelatedVideos: React.FC<RelatedVideosProps> = ({
  videos,
  currentVideoId,
  onVideoSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-4">
            <div className="bg-gray-700 w-40 h-24 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos
        .filter(video => video.id !== currentVideoId)
        .map(video => (
          <button
            key={video.id}
            onClick={() => onVideoSelect(video.id)}
            className="flex gap-3 w-full hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <div className="relative w-40 h-24 bg-gray-800 rounded-lg overflow-hidden">
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-medium text-white line-clamp-2">{video.name}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                {video.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatFileSize(video.size)}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
    </div>
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ metadata, youtubeId = null }) => {
  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
          title={metadata.file_name}
        />
      </div>
    );
  }

  const {
    videoRef,
    playerState,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    handleSeek,
    toggleFullscreen,
    setPlaybackRate,
  } = useVideoPlayer();

  return (
    <div className="w-full max-w-6xl mx-auto aspect-video bg-black relative">
      <video
        key={metadata.file_id}
        ref={videoRef}
        src={metadata.streamUrl}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
        autoPlay
      />

      {playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-300 border-l-transparent animate-spin" />
        </div>
      )}

      <PlayerControls
        playerState={playerState}
        togglePlay={togglePlay}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        handleSeek={handleSeek}
        toggleFullscreen={toggleFullscreen}
        setPlaybackRate={setPlaybackRate}
      />
    </div>
  );
};

export const YouTubeSuggestions: React.FC<Props> = ({ videos, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="bg-gray-700 w-40 h-24 rounded" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <button
          key={video.id}
          className="flex gap-3 w-full hover:bg-gray-800 p-2 rounded-lg transition-colors group"
          onClick={() => onSelect(video.id)}
        >
          <div className="relative w-40 h-24">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
              <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <p className="flex-1 text-sm font-medium text-white text-left line-clamp-2">
            {video.title}
          </p>
        </button>
      ))}
    </div>
  );
};

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

  // Get search query from either video title or YouTube ID
  const searchQuery = metadata?.file_name || youtubeId || '';
  const { videos: ytSuggestions, isLoading: loadingYT } = useYouTubeVideos(searchQuery);

  const handleVideoSelect = (id: string, isYoutube = false) => {
    if (isYoutube) {
      navigate(`/watch?youtube=${id}`);
    } else {
      navigate(`/watch?play=${id}`);
    }
  };

  useEffect(() => {
    if (!driveLoading && driveVideos.length > 0 && !playId && !youtubeId) {
      navigate(`/watch?play=${driveVideos[0].id}`, { replace: true });
    }
  }, [driveLoading, driveVideos, playId, youtubeId, navigate]);

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
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
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

export default Watch;