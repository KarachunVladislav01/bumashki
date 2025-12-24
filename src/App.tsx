import { useRoom } from './hooks/useRoom';
import { JoinRoom } from './components/JoinRoom';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

function App() {
  const {
    roomCode,
    playerId,
    roomState,
    error,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    clearError
  } = useRoom();

  // Экран ввода имени и выбора комнаты
  if (!roomCode || !playerId) {
    return (
      <JoinRoom
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
        onClearError={clearError}
      />
    );
  }

  // Лобби - ожидание игроков
  if (roomState.gamePhase === 'lobby') {
    return (
      <Lobby
        roomCode={roomCode}
        players={roomState.players}
        currentPlayerId={playerId}
        isHost={isHost}
        onStartGame={startGame}
        onLeave={leaveRoom}
      />
    );
  }

  // Игра
  return (
    <Game
      roomCode={roomCode}
      players={roomState.players}
      currentPlayerId={playerId}
      onLeave={leaveRoom}
    />
  );
}

export default App;
