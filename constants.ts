import { Recipe, MealType } from './types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Torrada com Abacate e Ovo',
    description: 'Pão de fermentação natural, abacate maduro, ovo pochê e flocos de pimenta.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq3JPH5e99GagQs3anp5suj2S4mUZ1g-IT9eZnOeKrbvqMKxytltKW-bGU9Z_9L_cJAgFTcOIMhWmkEUgZMtJKbmHg1Ez6mxMRdqj3pok9Ijbh4UzmeGZqx5Xa1E2hKBLHbkkNbf9ohWDX7u0GAbm0dQa83jtqterQvHa1C39b92k_XR5CMBfG3cGmyD2L2BVQEKLvh3Xo-u6rPBXT8HBzIExHnJevLCl7hqjfl66mVv9MaEqBp3T8W2Cf3LnbRSrivOx7hs3n0iM',
    calories: 350,
    time: '10 min',
    difficulty: 'Fácil',
    servings: 1,
    category: 'Café da Manhã',
    ingredients: [
      { id: 'i1', name: 'Pão de Forma', quantity: 1, unit: 'un' },
      { id: 'i2', name: 'Abacate', quantity: 0.5, unit: 'un' },
      { id: 'i3', name: 'Ovo', quantity: 1, unit: 'un' }
    ],
    steps: ['Toste o pão', 'Amasse o abacate', 'Faça o ovo pochê', 'Monte e tempere'],
    nutrition: { protein: 12, fats: 22, carbs: 28 }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Salmão Grelhado com Aspargos',
    description: 'Filé de salmão fresco grelhado com aspargos e um toque de limão siciliano.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAylnb67F1bW5G8SnQvPl3zqft0YbmVBP6UABoKL4dpgtm5wUmeRHSbFg9Gg-GGOTAjVIY_rQmQJJm3ZXIZvvqvAacoW8DoyXxAHkgIdW22uGDeeN5NLb4C4J-LPoukzF0FoAkZb6AyrCFx_cHBOLdLybGRcegvExCzXwsAvHJzqeGLry7hrIonR0ZE-MI8HDCYynQGf2ODhK4QKoE9bkaMSldnZYckYgozckt43itI18o_eR0FZBOa8ZL3fUsG3STOV0CKJJlJWHk',
    calories: 550,
    time: '25 min',
    difficulty: 'Médio',
    servings: 2,
    category: 'Jantar',
    ingredients: [
      { id: 'i4', name: 'Filé de Salmão', quantity: 400, unit: 'g' },
      { id: 'i5', name: 'Aspargos', quantity: 1, unit: 'maço' },
      { id: 'i6', name: 'Limão Siciliano', quantity: 0.5, unit: 'un' }
    ],
    steps: ['Prepare o salmão', 'Prepare os aspargos', 'Grelhe ambos', 'Finalize com limão'],
    nutrition: { protein: 32, fats: 18, carbs: 5 }
  },
  {
    id: '3',
    name: 'Bowl de Salada Verde',
    description: 'Uma explosão de frescor com mix de folhas, brócolis e molho especial.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq3JPH5e99GagQs3anp5suj2S4mUZ1g-IT9eZnOeKrbvqMKxytltKW-bGU9Z_9L_cJAgFTcOIMhWmkEUgZMtJKbmHg1Ez6mxMRdqj3pok9Ijbh4UzmeGZqx5Xa1E2hKBLHbkkNbf9ohWDX7u0GAbm0dQa83jtqterQvHa1C39b92k_XR5CMBfG3cGmyD2L2BVQEKLvh3Xo-u6rPBXT8HBzIExHnJevLCl7hqjfl66mVv9MaEqBp3T8W2Cf3LnbRSrivOx7hs3n0iM',
    calories: 280,
    time: '15 min',
    difficulty: 'Fácil',
    servings: 1,
    category: 'Almoço',
    ingredients: [
      { id: 'i7', name: 'Mix de Folhas', quantity: 100, unit: 'g' },
      { id: 'i8', name: 'Brócolis', quantity: 50, unit: 'g' }
    ],
    steps: ['Lave as folhas', 'Cozinhe o brócolis no vapor', 'Misture tudo', 'Adicione molho'],
    nutrition: { protein: 8, fats: 12, carbs: 15 }
  }
];

export const MOCK_USER = {
  name: 'Fernanda Silva',
  email: 'fernanda@example.com',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT6k_BycMX6SqIbMBShDJqt7lSqV4Qi_m7cSYby94qQcinqAikLNapfXuA3zcrcywP11J3CA4WNxX3plT41708SN8wzDlmJ9fX4lszk6a5gs6mkjsr4q8FhvS0WohksWnsmz59Wmh6wr6bLMuQZU3N2P_tyi0dXGZKOKmlg-pdyrKIbJW4_a0JQv1HA14t4RYosBgf2AxbrDa8qCVKZ-LvWbtuEEYcJyL4FOihXvBBx2Ka_GQ9x-AzX4lT-Jv_Mj4TC5XZdscVqfs',
  isPro: true,
  preferences: {
    dietaryRestrictions: ['Vegan', 'Sem Glúten'],
    goal: 'Manter peso (2000 kcal)',
    allergies: ['Amendoim']
  }
};

export const WATER_PROGRESS_COLORS = [
  '#3B82F6', // Blue (blue-500)
  '#10B981', // Green (emerald-500)
  '#A855F7', // Purple (purple-500)
];
