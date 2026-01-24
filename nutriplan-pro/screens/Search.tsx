
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { MOCK_RECIPES } from '../../constants';
import { ArrowLeft, Search as SearchIcon, Sliders, Plus, Zap, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [userRecipes, setUserRecipes] = useState<any[]>([]);

  const categories = ['Todas', 'Café da Manhã', 'Almoço', 'Jantar', 'Vegano', 'Low Carb'];

  useEffect(() => {
    if (user) {
      fetchUserRecipes();
    }
  }, [user]);

  const fetchUserRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, total_calories, imagem_url')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      setUserRecipes(data || []);
    } catch (err) {
      console.error('Error fetching user recipes:', err);
      setUserRecipes([]);
    }
  };

  const filteredRecipes = MOCK_RECIPES.filter(r =>
    (activeCategory === 'Todas' || r.category === activeCategory) &&
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">Buscar Receitas</h2>
        <div className="w-10"></div>
      </header>

      <div className="sticky top-[60px] z-20 bg-background-light dark:bg-background-dark pt-1 pb-4 shadow-sm">
        <div className="px-4 mb-4">
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <SearchIcon size={20} />
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-none bg-white dark:bg-surface-dark py-3.5 pl-10 pr-12 text-sm shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary transition-all"
              placeholder="Receitas, ingredientes, tags..."
              type="text"
            />
            <button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <span className="p-1.5 rounded-lg text-gray-400">
                <Sliders size={20} />
              </span>
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 transition-all ${activeCategory === cat
                ? 'bg-primary text-black shadow-lg shadow-primary/20 ring-1 ring-primary font-semibold'
                : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
            >
              <span className="text-sm">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        {/* Minhas Receitas Section */}
        {userRecipes.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Minhas Receitas</h3>
              <span onClick={() => navigate('/my-recipes')} className="text-xs font-medium text-primary cursor-pointer">Ver tudo</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {userRecipes.map((recipe) => (
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
          </>
        )}

        {/* Populares esta semana Section */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Populares esta semana</h3>
          <span className="text-xs font-medium text-slate-400 cursor-default">Ver tudo</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              className="group relative flex flex-col rounded-2xl bg-white dark:bg-surface-dark overflow-hidden shadow-sm border border-transparent hover:border-primary/30 transition-all"
            >
              <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${recipe.image})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100"></div>
                <button className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 dark:bg-black/80 text-primary shadow-md">
                  <Plus size={20} />
                </button>
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{recipe.category.split(' ')[0]}</span>
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1 gap-1">
                <h4 className="text-sm font-bold leading-tight line-clamp-2">{recipe.name}</h4>
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Zap size={14} className="text-primary" /> {recipe.calories}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {recipe.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Search;
