import { Player } from '../hooks/useRoom';

interface GameProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  onLeave: () => void;
}

export function Game({ roomCode, players, currentPlayerId, onLeave }: GameProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400 mb-2">
            Игра началась!
          </h1>
          <p className="text-slate-400">Комната: {roomCode}</p>
        </div>

        {/* Список игроков */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50 mb-6">
          <h2 className="text-slate-200 font-semibold mb-4">Игроки в игре</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <div 
                key={player.id}
                className={`p-4 rounded-xl ${
                  player.id === currentPlayerId 
                    ? 'bg-amber-500/10 border border-amber-500/30' 
                    : 'bg-slate-900/30'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-2 ${
                  player.isHost 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {player.name[0].toUpperCase()}
                </div>
                <p className={`font-medium truncate ${
                  player.id === currentPlayerId ? 'text-amber-200' : 'text-slate-200'
                }`}>
                  {player.name}
                </p>
                {player.id === currentPlayerId && (
                  <p className="text-slate-500 text-xs">(вы)</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Заглушка для игровой логики */}
        <div className="bg-slate-800/30 rounded-3xl p-8 border border-dashed border-slate-700 mb-6">
          <p className="text-slate-500">
            Здесь будет игровая логика
          </p>
          <p className="text-slate-600 text-sm mt-2">
            (добавьте свою механику игры)
          </p>
        </div>

        <button
          onClick={onLeave}
          className="py-3 px-6 text-slate-400 hover:text-red-400 font-medium rounded-2xl transition-colors text-sm"
        >
          Покинуть игру
        </button>
      </div>
    </div>
  );
}

