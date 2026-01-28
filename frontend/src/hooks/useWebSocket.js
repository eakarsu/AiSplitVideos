import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Hook for subscribing to job progress updates
export const useJobProgress = (jobId, callbacks = {}) => {
  const { socket, connected, subscribeToJob, unsubscribeFromJob } = useSocket();
  const { onProgress, onCompleted, onFailed } = callbacks;

  useEffect(() => {
    if (!socket || !connected || !jobId) return;

    // Subscribe to job updates
    subscribeToJob(jobId);

    // Set up event listeners
    const handleProgress = (data) => {
      if (data.jobId === jobId && onProgress) {
        onProgress(data);
      }
    };

    const handleCompleted = (data) => {
      if (data.jobId === jobId && onCompleted) {
        onCompleted(data);
      }
    };

    const handleFailed = (data) => {
      if (data.jobId === jobId && onFailed) {
        onFailed(data);
      }
    };

    socket.on('job:progress', handleProgress);
    socket.on('job:completed', handleCompleted);
    socket.on('job:failed', handleFailed);

    // Cleanup
    return () => {
      socket.off('job:progress', handleProgress);
      socket.off('job:completed', handleCompleted);
      socket.off('job:failed', handleFailed);
      unsubscribeFromJob(jobId);
    };
  }, [socket, connected, jobId, onProgress, onCompleted, onFailed, subscribeToJob, unsubscribeFromJob]);
};

// Hook for subscribing to upload progress updates
export const useUploadProgress = (callbacks = {}) => {
  const { socket, connected } = useSocket();
  const { onProgress } = callbacks;

  useEffect(() => {
    if (!socket || !connected) return;

    const handleProgress = (data) => {
      if (onProgress) {
        onProgress(data);
      }
    };

    socket.on('upload:progress', handleProgress);

    return () => {
      socket.off('upload:progress', handleProgress);
    };
  }, [socket, connected, onProgress]);
};

export default useJobProgress;
