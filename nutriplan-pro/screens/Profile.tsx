
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_USER } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ImageCropperModal from '../../components/ImageCropperModal';

interface ProfileProps {
  onLogout: () => void;
}

interface UserProfile {
  nome: string;
  objetivo: string;
  peso_kg: number;
  altura_cm: number;
  idade: number;
  avatar_url?: string;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const { theme, setTheme } = useTheme();
  const { subscription } = useSubscription();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isObjectiveOpen, setIsObjectiveOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({
    nome: '',
    objetivo: 'manter',
    peso_kg: 70,
    altura_cm: 170,
    idade: 25,
    avatar_url: ''
  });
  const [cropper, setCropper] = useState<{
    image: string;
    onComplete: (blob: Blob) => void;
  } | null>(null);
  const objectiveRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Efeito para scrollar automaticamente quando abrir o dropdown de objetivo
  useEffect(() => {
    if (isEditing && isObjectiveOpen && objectiveRef.current) {
      setTimeout(() => {
        objectiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isObjectiveOpen, isEditing]);

  // Efeito para travar o scroll da página de fundo quando o modal de edição estiver aberto
  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isEditing]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('perfis_usuario')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setEditForm(data);
      } else {
        // Create initial profile if not exists
        const newProfile = {
          id: user?.id,
          nome: user?.user_metadata?.full_name || '',
          objetivo: 'manter'
        };
        const { error: insertError } = await supabase
          .from('perfis_usuario')
          .insert(newProfile);

        if (!insertError) {
          setProfile(newProfile as any);
          setEditForm(newProfile as any);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
    navigate('/login');
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleDirectAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropper({
        image: reader.result as string,
        onComplete: async (blob: Blob) => {
          try {
            setUploading(true);
            setCropper(null);

            // Convert Blob to File
            const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const newAvatarUrl = await uploadAvatar(croppedFile);

            const { error: updateError } = await supabase
              .from('perfis_usuario')
              .update({ avatar_url: newAvatarUrl })
              .eq('id', user.id);

            if (updateError) throw updateError;

            if (profile) setProfile({ ...profile, avatar_url: newAvatarUrl });
            setEditForm({ ...editForm, avatar_url: newAvatarUrl });

            showNotification('Foto de perfil atualizada com sucesso!', {
              title: 'Sucesso'
            });
          } catch (error: any) {
            console.error('Error uploading avatar:', error);
            showNotification(error.message || 'Erro ao fazer upload da foto');
          } finally {
            setUploading(false);
          }
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropper({
        image: reader.result as string,
        onComplete: async (blob: Blob) => {
          try {
            setUploading(true);
            setCropper(null);

            const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const newAvatarUrl = await uploadAvatar(croppedFile);
            setEditForm({ ...editForm, avatar_url: newAvatarUrl });
          } catch (error: any) {
            showNotification(error.message || 'Erro ao fazer upload da foto');
          } finally {
            setUploading(false);
          }
        }
      });
    };
    reader.readAsDataURL(file);
  };


  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Construct payload with only the fields we want to update
      const payload = {
        nome: editForm.nome,
        objetivo: editForm.objetivo,
        peso_kg: editForm.peso_kg,
        altura_cm: editForm.altura_cm,
        idade: editForm.idade,
        avatar_url: editForm.avatar_url
      };

      const { error } = await supabase
        .from('perfis_usuario')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile({ ...profile, ...payload } as UserProfile);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showNotification('Erro ao salvar perfil: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 overflow-x-hidden">
      <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
        <div className="w-12"></div>
        <h2 className="text-lg font-bold flex-1 text-center">{t('profile.title')}</h2>
        <div className="flex w-12 items-center justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5"
          >
            <span className="material-symbols-rounded text-[20px]">edit</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center px-4 pb-6 pt-2">
        <div className="relative mb-4 group cursor-pointer">
          <div className="h-32 w-32 rounded-full border-4 border-background-light dark:border-background-dark shadow-xl overflow-hidden relative flex items-center justify-center bg-white dark:bg-surface-dark">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="material-symbols-rounded text-slate-300 text-[80px]">person</span>
            )}
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-primary text-black rounded-full p-1.5 border-2 border-background-dark flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            {uploading ? (
              <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
            ) : (
              <span className="material-symbols-rounded text-[18px]">photo_camera</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleDirectAvatarUpload}
            disabled={uploading}
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-center">{profile?.nome || user?.user_metadata?.full_name || 'Usuário'}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal mt-1 text-center">{user?.email}</p>
        <div className={`mt-3 px-3 py-1 rounded-full border flex items-center gap-2 ${(subscription?.plan_type === 'simple' || subscription?.plan_type === 'premium') &&
          subscription?.status === 'active'
          ? 'bg-primary/20 border-primary/30'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
          {(subscription?.plan_type === 'simple' || subscription?.plan_type === 'premium') &&
            subscription?.status === 'active' ? (
            <>
              <span className="material-symbols-rounded text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Membro Pro</span>
            </>
          ) : (
            <>
              <span className="material-symbols-rounded text-slate-500 text-[16px]">star</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plano Grátis</span>
            </>
          )}
        </div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'favorite', label: 'Receitas', color: 'red', path: '/favorites' },
            { icon: 'history', label: 'Histórico', color: 'orange', path: '/history' },
            { icon: 'bar_chart_4_bars', label: 'Hidratação', color: 'blue', path: '/water-history' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col gap-2 rounded-xl bg-white dark:bg-surface-dark p-4 items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary transition-all active:scale-95"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.color === 'red' ? 'bg-red-100 text-red-600' :
                item.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="px-4 text-lg font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-primary text-[20px]">monitor_heart</span>
          Informações Físicas
        </h3>
        <div className="mx-4 overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
          {[
            { label: 'Peso', value: `${profile?.peso_kg || '--'} kg` },
            { label: 'Altura', value: `${profile?.altura_cm || '--'} cm` },
            { label: 'Idade', value: `${profile?.idade || '--'} anos` },
            { label: 'Objetivo', value: profile?.objetivo === 'emagrecer' ? 'Emagrecer' : profile?.objetivo === 'ganhar_massa' ? 'Ganhar Massa' : 'Manter' }
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between p-4 active:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex flex-col">
                <span className="text-base font-medium">{pref.label}</span>
                <span className="text-xs text-slate-500">{pref.value}</span>
              </div>
              <span className="material-symbols-rounded text-slate-400 text-[20px]">chevron_right</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="px-4 text-lg font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-primary text-[20px]">settings</span>
          Configurações
        </h3>
        <div className="mx-4 overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600">
                <span className="material-symbols-rounded text-slate-600 text-[20px]">notifications</span>
              </div>
              <span className="text-base font-medium">{t('profile.notifications')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input checked readOnly className="sr-only peer" type="checkbox" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 active:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600">
                <span className="material-symbols-rounded text-slate-600 text-[20px]">lock</span>
              </div>
              <span className="text-base font-medium">Privacidade e Dados</span>
            </div>
            <span className="material-symbols-rounded text-slate-400 text-[20px]">chevron_right</span>
          </div>
          <div className="overflow-hidden">
            <div
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600">
                  <span className="material-symbols-rounded text-slate-600 dark:text-slate-400 text-[20px]">language</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium">{t('profile.language')}</span>
                  {!isLanguageOpen && (
                    <span className="text-xs text-primary font-bold">
                      {i18n.language === 'pt' ? 'Português' :
                        i18n.language === 'en' ? 'English' :
                          i18n.language === 'es' ? 'Español' :
                            i18n.language === 'fr' ? 'Français' :
                              i18n.language === 'de' ? 'Deutsch' :
                                i18n.language === 'nl' ? 'Nederlands' : 'Português'}
                    </span>
                  )}
                </div>
              </div>
              <span className={`material-symbols-rounded text-slate-400 text-[20px] transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`}>
                keyboard_arrow_down
              </span>
            </div>

            <div className={`px-4 pb-4 transition-all duration-300 ${isLanguageOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'pt', name: 'Português', flag: '🇧🇷' },
                  { code: 'en', name: 'English', flag: '🇺🇸' },
                  { code: 'es', name: 'Español', flag: '🇪🇸' },
                  { code: 'fr', name: 'Français', flag: '🇫🇷' },
                  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setTimeout(() => setIsLanguageOpen(false), 300);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${i18n.language === lang.code
                      ? 'bg-primary/20 border-primary text-primary shadow-sm'
                      : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                  >
                    <span className="text-lg mb-1">{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="px-4 text-lg font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-primary text-[20px]">dark_mode</span>
          {t('profile.appearance')}
        </h3>
        <div className="mx-4 p-1 rounded-2xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-center relative h-12">
          {[
            { id: 'light', icon: 'light_mode' },
            { id: 'dark', icon: 'dark_mode' },
            { id: 'auto', icon: 'monitor' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id as any)}
              className={`flex-1 flex items-center justify-center h-10 rounded-xl transition-all relative z-10 ${theme === opt.id
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <span className={`material-symbols-rounded text-[20px] ${theme === opt.id ? '' : ''}`} style={theme === opt.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {opt.icon}
              </span>
            </button>
          ))}
          <div
            className="absolute h-10 bg-primary rounded-xl transition-all duration-300 shadow-sm"
            style={{
              width: 'calc((100% - 8px) / 3)',
              left: theme === 'light' ? '4px' : theme === 'dark' ? 'calc(4px + (100% - 8px) / 3)' : 'calc(4px + 2 * (100% - 8px) / 3)'
            }}
          />
        </div>
      </div>

      <div className="px-4 mt-8 pb-32">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-white dark:bg-surface-dark text-red-500 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-rounded text-[20px]">logout</span>
          {t('profile.logout')}
        </button>
        <p className="text-center text-xs text-slate-400 mt-4">Versão 2.4.0</p>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl animate-in zoom-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 pb-2 shrink-0">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <span className="material-symbols-rounded text-[20px]">close</span>
              </button>
            </div>

            <div ref={modalScrollRef} className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
              <div className="space-y-4">
                <div className="flex flex-col items-center mb-6 pt-2">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden relative flex items-center justify-center bg-white dark:bg-surface-dark shadow-inner">
                      {editForm.avatar_url || profile?.avatar_url ? (
                        <img
                          src={editForm.avatar_url || profile?.avatar_url || ''}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-rounded text-slate-300 text-[70px]">person</span>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 bg-primary text-black rounded-full p-2 border-4 border-white dark:border-surface-dark cursor-pointer shadow-lg active:scale-90 transition-transform">
                      <span className="material-symbols-rounded text-[20px]">upload</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 mt-3 tracking-wide uppercase">Toque para trocar foto</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nome</label>
                  <input
                    type="text"
                    value={editForm.nome}
                    onFocus={() => setIsObjectiveOpen(false)}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={editForm.peso_kg}
                      onFocus={() => setIsObjectiveOpen(false)}
                      onChange={(e) => setEditForm({ ...editForm, peso_kg: Number(e.target.value) })}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={editForm.altura_cm}
                      onFocus={() => setIsObjectiveOpen(false)}
                      onChange={(e) => setEditForm({ ...editForm, altura_cm: Number(e.target.value) })}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Idade</label>
                  <input
                    type="number"
                    value={editForm.idade}
                    onFocus={() => setIsObjectiveOpen(false)}
                    onChange={(e) => setEditForm({ ...editForm, idade: Number(e.target.value) })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center font-bold"
                  />
                </div>

                <div className="relative" ref={objectiveRef}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Objetivo</label>
                  <button
                    type="button"
                    onClick={() => setIsObjectiveOpen(!isObjectiveOpen)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left font-medium"
                  >
                    <span>
                      {editForm.objetivo === 'emagrecer' ? 'Emagrecer' :
                        editForm.objetivo === 'ganhar_massa' ? 'Ganhar Massa' : 'Manter Peso'}
                    </span>
                    <span className={`material-symbols-rounded text-[24px] transition-transform ${isObjectiveOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>keyboard_arrow_down</span>
                  </button>

                  {isObjectiveOpen && (
                    <div className="absolute z-20 w-full mt-2 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden ring-4 ring-black/5">
                      {[
                        { value: 'emagrecer', label: 'Emagrecer' },
                        { value: 'manter', label: 'Manter Peso' },
                        { value: 'ganhar_massa', label: 'Ganhar Massa' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, objetivo: opt.value });
                            setIsObjectiveOpen(false);
                          }}
                          className={`w-full p-4 text-left text-sm font-bold transition-all flex items-center justify-between ${editForm.objetivo === opt.value
                            ? 'bg-primary text-black'
                            : 'text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        >
                          {opt.label}
                          {editForm.objetivo === opt.value && <span className="material-symbols-rounded text-[20px]">check_circle</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 shrink-0">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />

      {cropper && (
        <ImageCropperModal
          image={cropper.image}
          onCropComplete={cropper.onComplete}
          onCancel={() => setCropper(null)}
        />
      )}
    </div>
  );
};

export default Profile;
