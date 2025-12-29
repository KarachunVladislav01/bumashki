import { useState, useEffect, useRef } from 'react';
import { Player } from '../hooks/useRoom';
import { SketchBox } from '../components/SketchBox';
import { PencilButton } from '../components/PencilButton';
import { PencilInput } from '../components/PencilInput';
import CheckIcon from '../assets/check.svg?react';


interface LobbyProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: (hostWord: string) => void | Promise<void>;
  onLeave: () => void;
  onSubmitWord: (word: string) => void;
}

export function Lobby({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onLeave,
  onSubmitWord
}: LobbyProps) {
  const [ copied, setCopied ] = useState(false);
  const [ word, setWord ] = useState('');
  const wordInputRef = useRef<HTMLInputElement>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isReady = currentPlayer?.isReady || false;
  const allPlayersReady = players
    .filter(p => p.id !== currentPlayerId)
    .every(p => p.isReady);
  const canStart = players.length >= 2 && allPlayersReady;
  const startLabel = players.length < 2
    ? 'Need 2+ players'
    : allPlayersReady ? 'Start game' : 'Waiting for players to submit words';

  useEffect(() => {
    wordInputRef.current?.focus();
  }, []);

  const sortedPlayers = [ ...players ].sort((a, b) => {
    if (a.id === currentPlayerId) return -1;
    if (b.id === currentPlayerId) return 1;
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    return a.joinedAt - b.joinedAt;
  });

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleSubmitWord = () => {
    if (word.trim()) {
      onSubmitWord(word);
    }
  };

  const handleStartGame = () => {
    if (word.trim()) {
      onStartGame(word);
    }
  };

  return (
    <div className="min-h-screen paper-bg flex justify-center p-4">
      <div className="w-full max-w-md mt-10 sm:mt-16">
        <div className="text-center mb-6 sm:mb-8">
          <button
            onClick={copyRoomCode}
            className="inline-flex items-center gap-2 sm:gap-1 group"
          >
            <span
              className="text-4xl sm:text-5xl font-bold tracking-[0.15em] pencil-text"
              style={{ transform: 'rotate(-0.5deg)', fontFamily: "'Libre Baskerville', serif" }}
            >
              {roomCode}
            </span>
            <svg
              className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-300 ${copied ? 'text-[var(--pencil)]' : 'text-[var(--pencil-faint)] [@media(hover:hover)]:group-hover:text-[var(--pencil)]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>
        </div>

        <SketchBox>
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <PencilInput
              ref={wordInputRef}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Think of a word..."
              maxLength={50}
            />
            {isHost ? (
              <div className="mt-4">
                <PencilButton
                  onClick={handleStartGame}
                  disabled={!canStart || !word.trim()}
                  rotation={-0.5}
                >
                  {startLabel}
                </PencilButton>
              </div>
            ) : (
              <div className="mt-4">
                <PencilButton
                  onClick={handleSubmitWord}
                  disabled={!word.trim()}
                  rotation={0.3}
                >
                  {isReady ?
                    <div className="flex justify-center items-center gap-2">
                      Ready
                      <CheckIcon className="w-5 h-5" />
                    </div> : 'Ready'}
                </PencilButton>
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6"></div>

          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2 sm:p-3 transition-all border-b-[1px] border-[var(--paper-lines)]"
                  style={{
                    animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >

                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--pencil)] text-lg sm:text-xl truncate">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-[var(--pencil-faint)] text-sm sm:text-base ml-2">(you)</span>
                      )}
                    </p>
                  </div>

                  {player.isReady && (
                    <CheckIcon className="w-5 h-5 text-[var(--pencil)]" />)}
                </div>
              ))}
            </div>

            <div className="flex items-center mt-2 gap-3 p-2 sm:p-3 transition-all border-b-[1px] border-[var(--paper-lines)]"
            >
              <p className="text-[var(--pencil-faint)] text-sm sm:text-base italic">Waiting for other players...</p>
            </div>
          </div>
        </SketchBox>

        <div className="mt-6 sm:mt-8 space-y-3">
          <button
            onClick={onLeave}
            className={`w-full py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg transition-all underline underline-offset-4 ${isHost
              ? 'text-[var(--eraser-pink)] hover:text-[var(--pencil)]'
              : 'text-[var(--pencil-faint)] hover:text-[var(--pencil)]'
              }`}
          >
            {isHost ? 'Close room' : 'Leave room'}
          </button>
        </div>
      </div >
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div >
  );
}
