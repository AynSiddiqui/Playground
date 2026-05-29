import { useRef, useCallback, useState } from 'react';
import type { ClientMessage, ServerMessage, Snapshot } from '../types';

interface UseWebSocketReturn {
  connect: () => void;
  disconnect: () => void;
  sendStart: (code: string) => void;
  sendStep: () => void;
  sendStop: () => void;
  sendCommand: (msg: ClientMessage) => void;
  isConnected: boolean;
  status: string;
  error: string | null;
}

/**
 * Custom hook for managing the WebSocket connection to the Go backend.
 * Handles connection lifecycle, message routing, and state updates.
 */
export function useWebSocket(
  onSnapshot: (snapshot: Snapshot) => void,
  onFinished: (exitCode: number) => void,
  wsUrl = 'ws://localhost:8080/ws'
): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const launchTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('connected');
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('disconnected');
      wsRef.current = null;
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        
        // Clear launch timeout if we get a response
        if (msg.event === 'LAUNCH_SUCCESS' || msg.event === 'error' || msg.event === 'snapshot') {
          if (launchTimeoutRef.current !== null) {
            window.clearTimeout(launchTimeoutRef.current);
            launchTimeoutRef.current = null;
          }
        }

        switch (msg.event) {
          case 'LAUNCH_SUCCESS':
            setStatus('ready');
            setError(null);
            break;
          case 'reconnecting':
            setStatus('reconnecting');
            setError('Connection lost, reconnecting...');
            break;
          case 'status':
            setStatus(msg.state ?? 'unknown');
            setError(null);
            break;
          case 'error':
            setError(msg.message ?? 'Unknown error');
            setStatus('error');
            break;
          case 'snapshot':
            if (msg.data) {
              setStatus('ready');
              onSnapshot(msg.data);
            }
            break;
          case 'finished':
            setStatus('finished');
            onFinished(msg.exitCode ?? 0);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
  }, [wsUrl, onSnapshot, onFinished]);

  const disconnect = useCallback(() => {
    if (launchTimeoutRef.current !== null) {
      window.clearTimeout(launchTimeoutRef.current);
      launchTimeoutRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setStatus('disconnected');
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendStart = useCallback((code: string) => {
    if (launchTimeoutRef.current !== null) {
      window.clearTimeout(launchTimeoutRef.current);
    }
    launchTimeoutRef.current = window.setTimeout(() => {
      setError('Backend Timeout: Debugger took too long to launch or crashed silently.');
      setStatus('error');
      disconnect();
    }, 10000);
    
    send({ command: 'start', code });
  }, [send, disconnect]);

  const sendStep = useCallback(() => {
    send({ command: 'step' });
  }, [send]);

  const sendStop = useCallback(() => {
    send({ command: 'stop' });
  }, [send]);

  return {
    connect,
    disconnect,
    sendStart,
    sendStep,
    sendStop,
    sendCommand: send,
    isConnected,
    status,
    error,
  };
}
