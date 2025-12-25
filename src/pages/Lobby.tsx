import { useState } from 'react';
import { Player } from '../hooks/useRoom';
import { SketchBox } from '../components/SketchBox';
import { PencilButton } from '../components/PencilButton';

interface LobbyProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function Lobby({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onLeave
}: LobbyProps) {
  const canStart = players.length >= 2;
  const [ copied, setCopied ] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--pencil)] text-xl sm:text-2xl">Players</h2>
              <span className="text-[var(--pencil-faint)] text-base">
                {players.length}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {players.map((player, index) => (
                <div 
                  key={player.id}
                  className={`flex items-center gap-3 p-2 sm:p-3 transition-all border-b-[1px] ${
                    player.id === currentPlayerId 
                      ? 'bg-[var(--highlight)] border-[var(--pencil-faint)]' 
                      : 'border-[var(--paper-lines)]'
                  }`}
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

                  {player.isHost && (
                    <span className="px-2 py-0.5 text-[var(--pencil-light)] text-sm italic">
                      host
                    </span>
                  )}
                </div>
              ))}
            </div>

            {players.length < 2 && (
              <div className="mt-4 p-3 sm:p-4 border border-dashed border-[var(--pencil-faint)]">
                <div className="flex items-center gap-3 text-[var(--pencil-faint)]">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-dashed border-[var(--pencil-faint)] flex items-center justify-center animate-pulse">
                    <span className="text-sm sm:text-base">?</span>
                  </div>
                  <p className="text-sm sm:text-base italic">Waiting for other players...</p>
                </div>
              </div>
            )}
          </div>
        </SketchBox>

        <div className="mt-6 sm:mt-8 space-y-3">
          {isHost && (
            <PencilButton
              onClick={onStartGame}
              disabled={!canStart}
              rotation={-0.5}
            >
              {canStart ? 'Start game' : 'Need 2+ players'}
            </PencilButton>
          )}

          {!isHost && (
            <div className="w-full py-3 sm:py-4 px-4 sm:px-6 text-[var(--pencil-faint)] text-center text-lg sm:text-xl border-2 border-dashed border-[var(--pencil-faint)]">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[var(--pencil-faint)] rounded-full animate-pulse"></div>
                <span className="italic">Waiting for host...</span>
              </div>
            </div>
          )}

          <button
            onClick={onLeave}
            className={`w-full py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg transition-all ${
              isHost 
                ? 'text-[var(--eraser-pink)] border-b-2 border-[var(--eraser-pink)] hover:text-[var(--pencil)] hover:border-[var(--pencil)]' 
                : 'text-[var(--pencil-faint)] hover:text-[var(--pencil)] underline underline-offset-4'
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
