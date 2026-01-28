import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);

      // Join user room if authenticated
      if (user?.id) {
        newSocket.emit('join-user', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  // Subscribe to a specific job's updates
  const subscribeToJob = (jobId) => {
    if (socket && connected) {
      socket.emit('subscribe-job', jobId);
    }
  };

  // Unsubscribe from a job's updates
  const unsubscribeFromJob = (jobId) => {
    if (socket && connected) {
      socket.emit('unsubscribe-job', jobId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, subscribeToJob, unsubscribeFromJob }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
