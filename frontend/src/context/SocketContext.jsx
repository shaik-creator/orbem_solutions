import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../services/authService';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [activeSocket, setActiveSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveSocket(null);
      return undefined;
    }

    // Connect to the Socket.IO server
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setActiveSocket(socket);

    socket.on('connect', () => {
      console.log('Socket.IO connected to backend:', API_BASE_URL);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    // Listen to backend events and dispatch matching browser events
    socket.on('bookings:update', (data) => {
      console.log('Socket event bookings:update', data);
      window.dispatchEvent(new CustomEvent('orbem:refresh-bookings', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-dashboard', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-calendar', { detail: data }));
    });

    socket.on('shipments:update', (data) => {
      console.log('Socket event shipments:update', data);
      window.dispatchEvent(new CustomEvent('orbem:refresh-bookings', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-dashboard', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-calendar', { detail: data }));
    });

    socket.on('payments:update', (data) => {
      console.log('Socket event payments:update', data);
      window.dispatchEvent(new CustomEvent('orbem:refresh-payments', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-dashboard', { detail: data }));
    });

    socket.on('tasks:update', (data) => {
      console.log('Socket event tasks:update', data);
      window.dispatchEvent(new CustomEvent('orbem:refresh-tasks', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-calendar', { detail: data }));
    });

    socket.on('alerts:update', (data) => {
      console.log('Socket event alerts:update', data);
      window.dispatchEvent(new CustomEvent('orbem:refresh-notifications', { detail: data }));
      window.dispatchEvent(new CustomEvent('orbem:refresh-dashboard', { detail: data }));
    });

    return () => {
      socket.disconnect();
      setActiveSocket(null);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={activeSocket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
