import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Custom hook for Socket.IO real-time connection.
 * 
 * Returns { isConnected, clientCount, serverTime, on, off }
 * 
 * Usage:
 *   const { isConnected, on, off } = useSocket();
 *   useEffect(() => {
 *     const handler = (data) => setNews(data.news);
 *     on('news_update', handler);
 *     return () => off('news_update', handler);
 *   }, [on, off]);
 */
export default function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    // Build WebSocket URL: same origin, /ws path
    const wsUrl = BACKEND_URL || window.location.origin;

    const socket = io(wsUrl, {
      path: '/api/ws/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
      setIsConnected(false);
    });

    socket.on('connection_ack', (data) => {
      setClientCount(data.clients || 0);
      setServerTime(data.server_time);
    });

    socket.on('heartbeat', (data) => {
      setClientCount(data.clients || 0);
      setServerTime(data.server_time);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { isConnected, clientCount, serverTime, on, off };
}
