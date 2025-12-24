import { useState } from 'react';
import { Player } from '../hooks/useRoom';

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
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button 
              onClick={copyRoomCode}
              className="inline-flex items-center gap-3 group"
            >
              <span className="text-6xl sm:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 tracking-[0.15em]">
                {roomCode}
              </span>
              <svg 
                className={`w-12 h-12 sm:w-14 sm:h-14 transition-colors duration-300 ${copied ? 'text-amber-400' : 'text-slate-500 [@media(hover:hover)]:group-hover:text-amber-400'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

        {/* Карточка с игроками */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-200 font-semibold">Игроки в комнате</h2>
            <span className="px-3 py-1 bg-slate-700/50 rounded-full text-slate-400 text-sm">
              {players.length}
            </span>
          </div>

          {/* Список игроков */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  player.id === currentPlayerId 
                    ? 'bg-amber-500/10 border border-amber-500/30' 
                    : 'bg-slate-900/30'
                }`}
                style={{
                  animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    player.id === currentPlayerId ? 'text-amber-200' : 'text-slate-200'
                  }`}>
                    {player.name}
                    {player.id === currentPlayerId && (
                      <span className="text-slate-500 text-sm ml-2">(вы)</span>
                    )}
                  </p>
                </div>

                {/* Бейдж админа */}
                {player.isHost && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
                    Админ
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Ожидание игроков */}
          {players.length < 2 && (
            <div className="mt-4 p-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center animate-pulse">
                  <span className="text-slate-600">?</span>
                </div>
                <p className="text-sm">Ожидание других игроков...</p>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
          {/* Кнопка Старт - только для админа */}
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-bold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-lg shadow-emerald-500/25 disabled:shadow-none text-lg"
            >
              {canStart ? '▶ Старт' : `Нужно минимум 2 игрока`}
            </button>
          )}

          {/* Для не-админа - статус ожидания */}
          {!isHost && (
            <div className="w-full py-4 px-6 bg-slate-700/30 text-slate-400 text-center font-medium rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Ожидание старта от админа...
              </div>
            </div>
          )}

          {/* Кнопка выйти */}
          <button
            onClick={onLeave}
            className={`w-full py-3 px-6 font-medium rounded-2xl transition-all text-sm ${
              isHost 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {isHost ? 'Закрыть комнату' : 'Выйти из комнаты'}
          </button>
        </div>
      </div>

      {/* CSS анимация */}
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
    </div>
  );
}
