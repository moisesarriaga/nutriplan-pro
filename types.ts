
export enum MealType {
  Breakfast = 'Café da Manhã',
  Lunch = 'Almoço',
  Dinner = 'Jantar',
  Snack = 'Lanche'
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  priceType?: string;
  checked?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  calories: number;
  time: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  servings: number;
  category: string;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: {
    protein: number;
    fats: number;
    carbs: number;
  };
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  isPro: boolean;
  preferences: {
    dietaryRestrictions: string[];
    goal: string;
    allergies: string[];
  };
}
