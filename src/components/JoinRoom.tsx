import { useState } from 'react';

interface JoinRoomProps {
  onCreateRoom: (name: string) => Promise<string>;
  onJoinRoom: (code: string, name: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

export function JoinRoom({ onCreateRoom, onJoinRoom, error, onClearError }: JoinRoomProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const isNameValid = name.trim().length > 0;

  const handleCreate = async () => {
    if (!isNameValid) return;
    setIsLoading(true);
    try {
      await onCreateRoom(name.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isNameValid || !roomCode.trim()) return;
    setIsLoading(true);
    try {
      await onJoinRoom(roomCode.trim(), name.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClick = () => {
    if (!isNameValid) return;
    onClearError();
    setShowCodeInput(true);
  };

  const handleBackFromCode = () => {
    setShowCodeInput(false);
    setRoomCode('');
    onClearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 mb-2 tracking-tight"
              style={{ fontFamily: 'Georgia, serif' }}>
            Бумажки
          </h1>
          <p className="text-slate-400 text-sm">Игра в слова для компании</p>
        </div>

        {/* Карточка */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          
          {!showCodeInput ? (
            <div className="space-y-6">
              {/* Инпут имени */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Ваше имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя..."
                  maxLength={20}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-lg"
                  autoFocus
                />
                {!isNameValid && (
                  <p className="text-slate-500 text-xs mt-2">Введите имя чтобы продолжить</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Кнопки */}
              <div className="space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={!isNameValid || isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-bold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-lg shadow-amber-500/25 disabled:shadow-none"
                >
                  {isLoading ? 'Создание...' : 'Создать комнату'}
                </button>
                
                <button
                  onClick={handleJoinClick}
                  disabled={!isNameValid || isLoading}
                  className="w-full py-4 px-6 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800/30 text-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed font-semibold rounded-2xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500 disabled:border-slate-700/30"
                >
                  Присоединиться
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Назад */}
              <button 
                onClick={handleBackFromCode}
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm flex items-center gap-1"
              >
                ← Назад
              </button>

              {/* Показываем имя */}
              <div className="p-3 bg-slate-900/30 rounded-xl">
                <p className="text-slate-400 text-sm">Вы входите как:</p>
                <p className="text-amber-300 font-semibold">{name}</p>
              </div>

              {/* Инпут кода комнаты */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Код комнаты
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXXX"
                  maxLength={5}
                  className="w-full px-4 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-center text-3xl tracking-[0.3em] font-mono uppercase"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!roomCode.trim() || isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-bold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-lg shadow-amber-500/25 disabled:shadow-none"
              >
                {isLoading ? 'Подключение...' : 'Войти в комнату'}
              </button>
            </div>
          )}
        </div>

        {/* Футер */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Минимум 2 игрока для начала игры
        </p>
      </div>
    </div>
  );
}
