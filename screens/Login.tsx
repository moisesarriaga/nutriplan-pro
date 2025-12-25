
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLogin(); // Maintain compatibility with App.tsx callback if needed
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-6 w-full max-w-md mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-4xl text-black filled">nutrition</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo de volta!</h1>
          <p className="text-slate-500 text-sm">Acesse sua conta para ver suas receitas e listas.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800/30">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold ml-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                className="block w-full pl-10 pr-4 py-3.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="seu@email.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-semibold">Senha</label>
              <button type="button" className="text-xs font-medium text-primary">Esqueceu a senha?</button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                className="block w-full pl-10 pr-12 py-3.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400" type="button">
                <span className="material-symbols-outlined text-[20px]">visibility_off</span>
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-black font-bold text-base py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
            ) : (
              <>
                <span>Entrar</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background-light dark:bg-background-dark text-slate-500">ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
            <span className="text-sm font-semibold">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined filled text-2xl">apple</span>
            <span className="text-sm font-semibold">Apple</span>
          </button>
        </div>
      </div>

      <div className="p-6 text-center w-full max-w-md mx-auto">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Não tem uma conta?
          <button onClick={() => navigate('/register')} className="font-bold text-primary ml-1">Criar conta</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
