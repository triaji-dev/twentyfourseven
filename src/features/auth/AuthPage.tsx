import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { User as UserIcon, Lock, Loader2, AlertCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { signInWithEmail, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Create a dummy email for Supabase
    // Use a real-looking TLD to pass validation
    const email = `${username.toLowerCase().replace(/\s/g, '')}@twentyfourseven.com`;

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUp(email, password, username);
        // Automatically sign in after signup (Supabase default usually allows this if confirm is off)
        // If confirm is on, we'd need to handle that.
        // Assuming development mode / confirm off for now.
      }
    } catch (err: any) {
      console.error(err);
      // Hide the technical email error if possible
      if (err.message?.includes('valid email')) {
        setError('Username format is invalid. Please use only letters and numbers.');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            TwentyFourSeven
          </h1>
          <p className="text-zinc-400">
            Track your life, one hour at a time.
          </p>
        </div>

        <div className="mt-8 bg-[#18181b] p-8 rounded-xl border border-zinc-800 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6 text-left">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-zinc-400">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  placeholder="username"
                  required
                  autoCapitalize='none'
                  autoCorrect='off'
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-left">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-red-500">
                  {error.includes('Invalid login credentials')
                    ? 'Incorrect username or password'
                    : error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
