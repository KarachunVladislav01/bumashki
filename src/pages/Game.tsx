import { GridList } from '../components/GridView';
import { Player } from '../hooks/useRoom';

interface GameProps {
  players: Player[];
  currentPlayerId: string;
  onLeave: () => void;
}

export function Game({ players, currentPlayerId, onLeave: _onLeave }: GameProps) {
  const visiblePlayers = players.filter((player) => player.id !== currentPlayerId);

  return (
     <GridList
      items={visiblePlayers}
      renderItem={(p) => (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-xl font-semibold">{p.name}</div>
          <div className="text-sm text-gray-500">{p.word}</div>
        </div>
      )}
    />
  );
}
