import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

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
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
