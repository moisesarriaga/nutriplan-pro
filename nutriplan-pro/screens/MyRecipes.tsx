
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { ArrowLeft, Plus, Zap, Utensils } from 'lucide-react';

const MyRecipes: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyRecipes();
        }
    }, [user]);

    const fetchMyRecipes = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('receitas')
                .select('id, nome, total_calories, imagem_url, created_at')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecipes(data || []);
        } catch (err) {
            console.error('Error fetching my recipes:', err);
            setRecipes([]);
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
                <h2 className="text-lg font-bold flex-1 text-center">Minhas Receitas</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <Utensils className="text-slate-300" size={64} />
                        <p className="text-slate-500">Você ainda não criou nenhuma receita.</p>
                        <button
                            onClick={() => navigate('/create-recipe')}
                            className="px-6 py-3 bg-primary text-black font-bold rounded-xl flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Criar Receita
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                className="group relative flex flex-col rounded-2xl bg-white dark:bg-surface-dark overflow-hidden shadow-sm border border-transparent hover:border-primary/30 transition-all"
                            >
                                <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                        style={{ backgroundImage: `url(${recipe.imagem_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'})` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100"></div>
                                    <button className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 dark:bg-black/80 text-primary shadow-md">
                                        <Plus size={20} />
                                    </button>
                                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">MINHAS</span>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-1 gap-1">
                                    <h4 className="text-sm font-bold leading-tight line-clamp-2">{recipe.nome}</h4>
                                    <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1 text-primary font-medium">
                                            <Zap size={14} className="text-primary" /> {recipe.total_calories || 0}
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

export default MyRecipes;
