
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, User, Mail, Lock, EyeOff } from 'lucide-react';

interface RegisterProps {
  onRegister: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onRegister();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Criar Conta</h1>
          <p className="text-slate-500 dark:text-gray-400">Junte-se a nós para gerenciar sua nutrição e compras de forma simples.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800/30">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-gray-300">Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="text-slate-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark focus:ring-primary focus:border-primary shadow-sm"
                placeholder="Seu nome"
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister(e as any)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-gray-300">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="text-slate-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark focus:ring-primary focus:border-primary shadow-sm"
                placeholder="seu@email.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister(e as any)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-gray-300">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="text-slate-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-10 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark focus:ring-primary focus:border-primary shadow-sm"
                placeholder="Mínimo 8 caracteres"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister(e as any)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400">
                <EyeOff className="text-slate-400" size={20} />
              </div>
            </div>
          </div>

          <div className="flex items-start mt-4">
            <div className="flex items-center h-5">
              <input className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" required type="checkbox" />
            </div>
            <div className="ml-3 text-sm">
              <label className="text-slate-600 dark:text-slate-400">
                Eu concordo com os <button type="button" className="font-medium text-primary">Termos de Serviço</button> e <button type="button" className="font-medium text-primary">Política de Privacidade</button>.
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-black bg-primary active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Já tem uma conta?
            <button onClick={() => navigate('/login')} className="font-semibold text-primary ml-1">Faça Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
