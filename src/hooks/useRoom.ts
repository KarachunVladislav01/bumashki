import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ref, 
  set, 
  onValue, 
  remove,
  push,
  serverTimestamp,
  get,
  update
} from 'firebase/database';
import { database } from '../firebase';

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
}

export interface RoomState {
  players: Player[];
  gamePhase: 'lobby' | 'playing' | 'ended';
  hostId: string | null;
}

const HEARTBEAT_INTERVAL = 5000;
const PLAYER_TIMEOUT = 30000;
const SESSION_KEY = 'bumashki_session';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getSession(): { roomCode: string; playerId: string; playerName: string } | null {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveSession(roomCode: string, playerId: string, playerName: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId, playerName }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    players: [],
    gamePhase: 'lobby',
    hostId: null
  });
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isLeavingRef = useRef(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!roomCode || !playerId) return;
    try {
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
      await update(playerRef, { lastSeen: Date.now() });
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }, [roomCode, playerId]);

  useEffect(() => {
    if (!roomCode || !playerId) return;

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [roomCode, playerId, sendHeartbeat]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && roomCode && playerId) {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [roomCode, playerId, sendHeartbeat]);

  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        if (!isLeavingRef.current) {
          setError('Комната была закрыта администратором');
        }
        setRoomCode(null);
        setPlayerId(null);
        setIsConnected(false);
        clearSession();
        isLeavingRef.current = false;
        return;
      }

      const now = Date.now();
      const players: Player[] = data.players 
        ? Object.entries(data.players)
            .filter(([, player]: [string, any]) => {
              const lastSeen = player.lastSeen || player.joinedAt;
              return now - lastSeen < PLAYER_TIMEOUT;
            })
            .map(([id, player]: [string, any]) => ({
              id,
              name: player.name,
              joinedAt: player.joinedAt,
              isHost: id === data.hostId
            }))
        : [];

      players.sort((a, b) => a.joinedAt - b.joinedAt);

      setRoomState({
        players,
        gamePhase: data.gamePhase || 'lobby',
        hostId: data.hostId
      });
      setIsConnected(true);
    }, (err) => {
      setError('Ошибка подключения: ' + err.message);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [roomCode]);

  const createRoom = useCallback(async (playerName: string): Promise<string> => {
    setError(null);
    isLeavingRef.current = false;
    
    const code = generateRoomCode();
    const roomRef = ref(database, `rooms/${code}`);
    const playerRef = push(ref(database, `rooms/${code}/players`));
    const newPlayerId = playerRef.key!;

    try {
      await set(roomRef, {
        createdAt: serverTimestamp(),
        gamePhase: 'lobby',
        hostId: newPlayerId
      });

      const now = Date.now();
      await set(playerRef, {
        name: playerName,
        joinedAt: now,
        lastSeen: now
      });

      setRoomCode(code);
      setPlayerId(newPlayerId);
      saveSession(code, newPlayerId, playerName);
      
      return code;
    } catch (err: any) {
      setError('Не удалось создать комнату: ' + err.message);
      throw err;
    }
  }, []);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<void> => {
    setError(null);
    isLeavingRef.current = false;
    
    const normalizedCode = code.toUpperCase().trim();
    const roomRef = ref(database, `rooms/${normalizedCode}`);
    
    try {
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        setError('Комната с таким кодом не найдена');
        return;
      }

      const roomData = snapshot.val();
      
      if (roomData.gamePhase !== 'lobby') {
        setError('Игра уже началась, нельзя присоединиться');
        return;
      }

      const playerRef = push(ref(database, `rooms/${normalizedCode}/players`));
      const newPlayerId = playerRef.key!;

      const now = Date.now();
      await set(playerRef, {
        name: playerName,
        joinedAt: now,
        lastSeen: now
      });

      setRoomCode(normalizedCode);
      setPlayerId(newPlayerId);
      saveSession(normalizedCode, newPlayerId, playerName);
    } catch (err: any) {
      setError('Не удалось присоединиться: ' + err.message);
      throw err;
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !playerId) return;

    isLeavingRef.current = true;

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    try {
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
      await remove(playerRef);

      if (roomState.hostId === playerId) {
        const roomRef = ref(database, `rooms/${roomCode}`);
        await remove(roomRef);
      }
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    }

    clearSession();
    setRoomCode(null);
    setPlayerId(null);
    setIsConnected(false);
  }, [roomCode, playerId, roomState.hostId]);

  const restoreSession = useCallback(async () => {
    const session = getSession();
    if (!session) return false;

    try {
      const roomRef = ref(database, `rooms/${session.roomCode}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        clearSession();
        return false;
      }

      const roomData = snapshot.val();
      const playerData = roomData.players?.[session.playerId];
      
      if (playerData) {
        const playerRef = ref(database, `rooms/${session.roomCode}/players/${session.playerId}`);
        await update(playerRef, { lastSeen: Date.now() });
        
        setRoomCode(session.roomCode);
        setPlayerId(session.playerId);
        return true;
      } else {
        clearSession();
        return false;
      }
    } catch (err) {
      console.error('Session restore error:', err);
      clearSession();
      return false;
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomCode && playerId) {
        const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
        remove(playerRef);
        
        if (roomState.hostId === playerId) {
          const roomRefPath = ref(database, `rooms/${roomCode}`);
          remove(roomRefPath);
        }
        clearSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomCode, playerId, roomState.hostId]);

  // Начать игру (только для хоста)
  const startGame = useCallback(async () => {
    if (!roomCode || roomState.hostId !== playerId) return;

    try {
      const gamePhaseRef = ref(database, `rooms/${roomCode}/gamePhase`);
      await set(gamePhaseRef, 'playing');
    } catch (err: any) {
      setError('Не удалось начать игру: ' + err.message);
    }
  }, [roomCode, playerId, roomState.hostId]);

  return {
    roomCode,
    playerId,
    roomState,
    error,
    isConnected,
    isHost: playerId === roomState.hostId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    clearError: () => setError(null)
  };
}
