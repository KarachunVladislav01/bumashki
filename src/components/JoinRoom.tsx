import { useState } from 'react';
import { CodeInput } from './CodeInput';

interface JoinRoomProps {
  onCreateRoom: (name: string) => Promise<string>;
  onJoinRoom: (code: string, name: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

export function JoinRoom({ onCreateRoom, onJoinRoom, error, onClearError }: JoinRoomProps) {
  const [ name, setName ] = useState('');
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isJoining, setIsJoining ] = useState(false);

  const isNameValid = name.trim().length > 0;

  const handleCreate = async () => {
    if (!isNameValid) return;
    setIsLoading(true);
    onClearError();
    try {
      await onCreateRoom(name.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (code: string) => {
    if (!isNameValid) return;
    setIsJoining(true);
    onClearError();
    try {
      await onJoinRoom(code, name.trim());
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 mb-2 tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}>
             BUMASHKI
          </h1>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          <div className="space-y-5">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); onClearError(); }}
              placeholder="Ваше имя"
              maxLength={20}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-lg"
              autoFocus
            />

            <CodeInput
              onSubmit={handleJoin}
              disabled={!isNameValid}
              isLoading={isJoining}
              onInputChange={onClearError}
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">или</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!isNameValid || isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-bold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-lg shadow-amber-500/25 disabled:shadow-none"
            >
              {isLoading ? 'Создание...' : 'Создать комнату'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
