
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { ArrowLeft, HeartOff, Utensils, Flame } from 'lucide-react';

interface FavoriteRecipe {
    id: string;
    nome: string;
    categoria: string;
    calorias_por_porcao: number;
}

const Favorites: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            const { data, error } = await supabase
                .from('receitas_favoritas')
                .select(`
          receitas (
            id,
            nome,
            categoria,
            calorias_por_porcao
          )
        `)
                .eq('usuario_id', user?.id);

            if (error) throw error;

            const formatted = data.map((f: any) => f.receitas);
            setFavorites(formatted);
        } catch (err) {
            console.error('Error fetching favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <div className="flex items-center px-4 py-4 justify-between sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-full h-10 w-10 text-slate-900 dark:text-white hover:bg-black/5">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center">Minhas Favoritas</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <HeartOff className="text-slate-300" size={64} />
                        <p className="text-slate-500">Você ainda não favoritou nenhuma receita.</p>
                        <button
                            onClick={() => navigate('/search')}
                            className="px-6 py-2 bg-primary text-black font-bold rounded-xl"
                        >
                            Explorar Receitas
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {favorites.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                className="group flex gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 active:scale-[0.98] transition cursor-pointer"
                            >
                                <div className="size-20 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                    <Utensils className="text-primary" size={32} />
                                </div>
                                <div className="flex flex-col justify-center flex-1">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{recipe.nome}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">{recipe.categoria || 'Geral'}</span>
                                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                                            <Flame className="fill-current" size={14} />
                                            {recipe.calorias_por_porcao || 0} kcal
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Navigation />
        </div>
    );
};

export default Favorites;
