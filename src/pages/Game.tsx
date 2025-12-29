import { Player } from '../hooks/useRoom';

interface GameProps {
  players: Player[];
  currentPlayerId: string;
  onLeave: () => void;
}

export function Game({ players, currentPlayerId, onLeave }: GameProps) {
  const playerNameMap = players.reduce<Record<string, string>>((acc, player) => {
    acc[player.id] = player.name;
    return acc;
  }, {});
  const visiblePlayers = players.filter((player) => player.id !== currentPlayerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">

        {/* Список игроков */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50 mb-6">
          <h2 className="text-slate-200 font-semibold mb-4">Players in game</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visiblePlayers.map((player) => (
              <div 
                key={player.id}
                className={`p-4 rounded-xl ${
                  player.assignedWord
                    ? 'bg-slate-900/30 border border-slate-800/70'
                    : 'bg-slate-900/10 border border-dashed border-slate-700'
                }`}
              >
                <p className="font-semibold text-slate-100 truncate">
                  {player.name}
                  {player.assignedFrom && (
                    <span className="text-xs text-slate-500 ml-1">
                      (word from {playerNameMap[player.assignedFrom] || 'another player'})
                    </span>
                  )}
                </p>
                <p className="text-sm text-amber-200 mt-2 break-words">
                  {player.assignedWord || 'Waiting for word...'}
                </p>
              </div>
            ))}

            {visiblePlayers.length === 0 && (
              <div className="col-span-full text-slate-500 italic">
                Waiting for other players to join...
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onLeave}
          className="py-3 px-6 text-slate-400 hover:text-red-400 font-medium rounded-2xl transition-colors text-sm"
        >
          Leave game
        </button>
      </div>
    </div>
  );
}
