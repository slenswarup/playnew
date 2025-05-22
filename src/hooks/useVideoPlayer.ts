import { useState, useRef, useEffect } from 'react';
import { PlayerState } from '../types';

export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isFullscreen: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: true,
    playbackRate: 1
  });

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (playerState.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    setPlayerState(prev => ({
      ...prev,
      currentTime: videoRef.current?.currentTime || 0
    }));
  };

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    
    setPlayerState(prev => ({
      ...prev,
      duration: videoRef.current?.duration || 0
    }));
  };

  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return;
    
    const newVolume = Math.max(0, Math.min(1, value));
    videoRef.current.volume = newVolume;
    
    setPlayerState(prev => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0
    }));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMutedState = !playerState.isMuted;
    videoRef.current.muted = newMutedState;
    
    setPlayerState(prev => ({
      ...prev,
      isMuted: newMutedState
    }));
  };

  const handleSeek = (value: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(playerState.duration, value));
    videoRef.current.currentTime = newTime;
    
    setPlayerState(prev => ({
      ...prev,
      currentTime: newTime
    }));
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const setPlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlayerState(prev => ({
      ...prev,
      playbackRate: rate
    }));
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleWaiting = () => {
      setPlayerState(prev => ({ ...prev, isLoading: true }));
    };

    const handlePlaying = () => {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    };

    const handleFullscreenChange = () => {
      setPlayerState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement
      }));
    };

    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup event listeners
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    videoRef,
    playerState,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    handleSeek,
    toggleFullscreen,
    setPlaybackRate
  };
};