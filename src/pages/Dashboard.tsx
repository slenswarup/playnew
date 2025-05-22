// src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Film, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelatedVideos } from '../hooks/useRelatedVideos';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import { useVideoMetadata } from '../hooks/useVideoMetadata';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen }   from '../components/ErrorScreen';
import { VideoPlayer }   from '../components/VideoPlayer';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // read ?play= and ?youtube=
  const { search } = useLocation();
  const params     = new URLSearchParams(search);
  const playId     = params.get('play');
  const youtubeId  = params.get('youtube');

  // if playId, fetch its metadata
  const {
    metadata,
    isLoading: loadingMeta,
    error: metaError
  } = useVideoMetadata(playId);

  // Hooks for the grid
  const [searchQuery, setSearchQuery] = useState('');
  const [showYouTube, setShowYouTube] = useState(false);
  const { videos: driveVideos, isLoading: isDriveLoading } = useRelatedVideos();
  const { videos: youtubeVideos, search: searchYouTube, isLoading: isYoutubeLoading } = useYouTubeSearch();

  // when you click a grid tile
  const handleVideoClick = (id: string, isYT = false) => {
    if (isYT) {
      navigate(`/watch/${id}`);
    } else {
      navigate(`/watch/${id}`);
    }
  };

  // Header (always)
  const HeaderBar = (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Film className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">SwarupPlay</h1>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (searchQuery.trim()) {
              searchYouTube(searchQuery);
              setShowYouTube(true);
            }
          }}
          className="flex-1 mx-8"
        >
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full bg-gray-700 text-white rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>
        <div className="flex items-center space-x-4">
          <span className="text-white">{user?.name}</span>
          <button onClick={logout} className="text-gray-400 hover:text-white" title="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );

  // If ?play or ?youtube is set, show the VideoPlayer
  if (playId || youtubeId) {
    // auth guard
    if (loadingMeta) return <LoadingScreen />;
    if (metaError)  return <ErrorScreen message={metaError} />;

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {HeaderBar}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <VideoPlayer metadata={metadata!} youtubeId={youtubeId} />
        </main>
      </div>
    );
  }

  // Otherwise, show the dashboard grid
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {HeaderBar}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowYouTube(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !showYouTube
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Videos
          </button>
          <button
            onClick={() => setShowYouTube(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showYouTube
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            YouTube
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {showYouTube
            ? isYoutubeLoading
              ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-800 rounded-lg aspect-video mb-2"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                ))
              : youtubeVideos.map(v => (
                  <div
                    key={v.id}
                    onClick={() => handleVideoClick(v.id, true)}
                    className="cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gray-800">
                      {v.thumbnail ? (
                        <img
                          src={v.thumbnail}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      ) : (
                        <video
                          src={v.streamUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          muted
                          preload="metadata"
                          autoPlay
                        />
                      )}
                    </div>
                    <h3 className="text-white font-medium line-clamp-2 group-hover:text-purple-400">
                      {v.title}
                    </h3>
                  </div>
                ))
            : isDriveLoading
            ? Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg aspect-video mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))
            : driveVideos.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleVideoClick(v.id)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gray-800">
                    {v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    ) : (
                      <video
                        src={v.streamUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        muted
                        preload="metadata"
                        autoPlay
                      />
                    )}
                  </div>
                  <h3 className="text-white font-medium line-clamp-2 group-hover:text-purple-400">
                    {v.name}
                  </h3>
                  {v.duration && (
                    <p className="text-sm text-gray-400 mt-1">
                      {Math.floor(v.duration / 60)}:
                      {String(v.duration % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              ))}
        </div>
      </main>
    </div>
  );
}
