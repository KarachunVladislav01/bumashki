import { useRoom } from './hooks/useRoom';
import { JoinRoom } from './pages/JoinRoom';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';

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
    submitWord,
    clearError
  } = useRoom();

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

  if (roomState.gamePhase === 'lobby') {
    return (
      <Lobby
        roomCode={roomCode}
        players={roomState.players}
        currentPlayerId={playerId}
        isHost={isHost}
        onStartGame={startGame}
        onLeave={leaveRoom}
        onSubmitWord={submitWord}
      />
    );
  }

  return (
    <Game
      players={roomState.players}
      currentPlayerId={playerId}
      onLeave={leaveRoom}
    />
  );
}

export default App;
