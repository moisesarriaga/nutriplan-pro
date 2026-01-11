
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Activity, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-gray-200">
      <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-12 w-full max-w-md mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/20">
            <Activity className="text-black fill-current" size={36} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Bem-vindo de volta!</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Acesse sua conta para ver suas receitas e listas.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800/30">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold ml-1 text-slate-700 dark:text-gray-300">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="text-slate-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-4 py-3.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="seu@email.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">Senha</label>
              <button type="button" className="text-xs font-medium text-primary">Esqueceu a senha?</button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="text-slate-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-12 py-3.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
              />
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
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
                <ArrowRight size={20} />
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

        <div className="flex justify-center gap-4 mt-2">
          {/* Google Button */}
          <button className="flex items-center justify-center h-12 w-12 bg-white dark:bg-[#131314] border border-[#747775] dark:border-[#8e918f] rounded-full hover:shadow-md transition-all">
            <svg className="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
          </button>

          {/* Facebook Button */}
          <button className="flex items-center justify-center h-12 w-12 bg-white dark:bg-[#131314] border border-[#747775] dark:border-[#8e918f] rounded-full hover:shadow-md transition-all">
            <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* Apple Button */}
          <button className="flex items-center justify-center h-12 w-12 bg-white dark:bg-[#131314] border border-[#747775] dark:border-[#8e918f] rounded-full hover:shadow-md transition-all">
            <svg className="w-6 h-6 fill-black dark:fill-white" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          </button>
        </div>

        <div className="mt-8 text-center pb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Não tem uma conta?
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-primary ml-1 hover:underline transition-all"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div >
  );
};

export default Login;
