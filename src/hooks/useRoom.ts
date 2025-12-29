import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ref, 
  set, 
  onValue, 
  remove,
  push,
  serverTimestamp,
  get,
  update,
  runTransaction
} from 'firebase/database';
import { database } from '../firebase';

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
  word?: string;
  assignedWord?: string;
  assignedFrom?: string;
  isReady?: boolean;
}

export interface AssignedWord {
  word: string;
  authorId: string;
}

export interface AssignmentTableRow {
  playerId: string;
  name: string;
  word: string;
  assignedWord: string;
  assignedFrom: string;
}

export interface RoomState {
  players: Player[];
  gamePhase: 'lobby' | 'playing' | 'ended';
  hostId: string | null;
  assignments: Record<string, AssignedWord>;
  assignmentTable: Record<string, AssignmentTableRow>;
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

function shuffleArray<T>(array: T[]): T[] {
  const copy = [ ...array ];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ copy[i], copy[j] ] = [ copy[j], copy[i] ];
  }
  return copy;
}

// Generates a random distribution where no player receives their own word.
function buildAssignments(playersWithWords: { id: string; word: string }[]): Record<string, AssignedWord> {
  if (playersWithWords.length === 1) {
    return { [playersWithWords[0].id]: { word: playersWithWords[0].word, authorId: playersWithWords[0].id } };
  }

  const receivers = [ ...playersWithWords ];
  const wordOwners = [ ...playersWithWords ];

  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled = shuffleArray(wordOwners);
    const hasSelfWord = receivers.some((receiver, index) => receiver.id === shuffled[index].id);

    if (!hasSelfWord) {
      const assignments: Record<string, AssignedWord> = {};
      receivers.forEach((receiver, index) => {
        assignments[receiver.id] = {
          word: shuffled[index].word,
          authorId: shuffled[index].id
        };
      });
      return assignments;
    }
  }

  // Fallback: rotate to guarantee no one gets their own word
  const rotated = wordOwners.slice(1).concat(wordOwners[0]);
  const assignments: Record<string, AssignedWord> = {};
  receivers.forEach((receiver, index) => {
    const giver = rotated[index % rotated.length];
    assignments[receiver.id] = {
      word: giver.word,
      authorId: giver.id
    };
  });
  return assignments;
}

export function useRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    players: [],
    gamePhase: 'lobby',
    hostId: null,
    assignments: {},
    assignmentTable: {}
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
          setError('Room was closed by the administrator');
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
            .map(([id, player]: [string, any]) => {
              const assignment = data.assignments?.[id];
              return {
                id,
                name: player.name,
                joinedAt: player.joinedAt,
                isHost: id === data.hostId,
                word: player.word,
                assignedWord: player.assignedWord || assignment?.word,
                assignedFrom: player.assignedFrom || assignment?.authorId,
                isReady: player.isReady || false
              };
            })
        : [];

      players.sort((a, b) => a.joinedAt - b.joinedAt);

      setRoomState({
        players,
        gamePhase: data.gamePhase || 'lobby',
        hostId: data.hostId,
        assignments: data.assignments || {},
        assignmentTable: data.assignmentTable || {}
      });
      setIsConnected(true);
    }, (err) => {
      setError('Connection error: ' + err.message);
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
      setError('Failed to create room: ' + err.message);
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
        setError('Room with this code not found');
        return;
      }

      const roomData = snapshot.val();
      
      if (roomData.gamePhase !== 'lobby') {
        setError('Game already started, cannot join');
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
      setError('Failed to join: ' + err.message);
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
      console.error('Error leaving:', err);
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

  const startGame = useCallback(async (hostWord?: string) => {
    if (!roomCode || roomState.hostId !== playerId) return;

    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      const data = snapshot.val();

      if (!data?.players) {
        setError('No players in room');
        return;
      }

      const playersWithWords = Object.entries<any>(data.players).map(([id, player]) => ({
        id,
        word: (id === playerId && hostWord ? hostWord : player.word || '').trim()
      }));

      const missingWord = playersWithWords.find((player) => !player.word);
      if (missingWord) {
        setError('Every player must submit a word before starting');
        return;
      }

      const assignments = buildAssignments(playersWithWords);
      const assignmentTable = Object.entries(assignments).reduce<Record<string, AssignmentTableRow>>((acc, [receiverId, assignment]) => {
        const playerEntry = data.players?.[receiverId];
        acc[receiverId] = {
          playerId: receiverId,
          name: playerEntry?.name || '',
          word: playerEntry?.word || '',
          assignedWord: assignment.word,
          assignedFrom: assignment.authorId
        };
        return acc;
      }, {});

      const updates: Record<string, any> = {
        [`rooms/${roomCode}/gamePhase`]: 'playing',
        [`rooms/${roomCode}/assignments`]: assignments,
        [`rooms/${roomCode}/assignmentTable`]: assignmentTable
      };

      if (hostWord?.trim()) {
        updates[`rooms/${roomCode}/players/${playerId}/word`] = hostWord.trim();
        updates[`rooms/${roomCode}/players/${playerId}/isReady`] = true;
      }

      Object.entries(assignments).forEach(([receiverId, assignment]) => {
        updates[`rooms/${roomCode}/players/${receiverId}/assignedWord`] = assignment.word;
        updates[`rooms/${roomCode}/players/${receiverId}/assignedFrom`] = assignment.authorId;
      });

      await update(ref(database), updates);

      // Append each submitted word to a global archive list (stored as an array).
      const archiveRef = ref(database, 'wordArchive');
      await runTransaction(archiveRef, (current) => {
        const existing = Array.isArray(current) ? current : [];
        return [ ...existing, ...playersWithWords.map((player) => player.word) ];
      });
    } catch (err: any) {
      setError('Failed to start game: ' + err.message);
    }
  }, [roomCode, playerId, roomState.hostId]);

  const submitWord = useCallback(async (word: string) => {
    if (!roomCode || !playerId) return;

    try {
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
      await update(playerRef, { 
        word: word.trim(),
        isReady: true 
      });
    } catch (err: any) {
      setError('Failed to send word: ' + err.message);
    }
  }, [roomCode, playerId]);

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
    submitWord,
    clearError: () => setError(null)
  };
}
