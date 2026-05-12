import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../api/socket';

export function useChatSocket() {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onPresenceList = ({ online }) => {
      setOnlineUsers(new Set(online || []));
    };
    const onOnline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };
    const onOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('presence:list', onPresenceList);
    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('presence:list', onPresenceList);
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, []);

  const sendMessage = useCallback((to, text) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        reject(new Error('Not connected'));
        return;
      }
      socket.emit('message:send', { to, text }, (ack) => {
        if (ack?.ok) resolve(ack.message);
        else reject(new Error(ack?.error || 'Failed to send'));
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    connected,
    onlineUsers,
    sendMessage,
  };
}
