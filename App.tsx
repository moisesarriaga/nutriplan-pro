import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './nutriplan-pro/screens/Dashboard';
import Search from './nutriplan-pro/screens/Search';
import RecipeDetails from './nutriplan-pro/screens/RecipeDetails';
import MealPlanner from './nutriplan-pro/screens/MealPlanner';
import CreateRecipe from './nutriplan-pro/screens/CreateRecipe';
import ShoppingCart from './nutriplan-pro/screens/ShoppingCart';
import Profile from './nutriplan-pro/screens/Profile';
import Login from './nutriplan-pro/screens/Login';
import Register from './nutriplan-pro/screens/Register';
import Favorites from './nutriplan-pro/screens/Favorites';
import MealHistory from './nutriplan-pro/screens/MealHistory';
import SavedLists from './nutriplan-pro/screens/SavedLists';
import WaterLog from './nutriplan-pro/screens/WaterLog';
import Notifications from './nutriplan-pro/screens/Notifications';
import Scan from './nutriplan-pro/screens/Scan';
import LandingPage from './nutriplan-pro/screens/LandingPage';
import Checkout from './nutriplan-pro/screens/Checkout';
import ThankYou from './nutriplan-pro/screens/ThankYou';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center transition-colors duration-300">
      <div className="w-full max-w-[1000px] bg-background-light dark:bg-background-dark text-slate-900 dark:text-gray-200 min-h-screen relative shadow-2xl overflow-x-hidden transition-colors duration-300">
        {children}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={() => { }} />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onRegister={() => { }} />} />

      <Route
        path="/*"
        element={
          user ? (
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/recipe/:id" element={<RecipeDetails />} />
                <Route path="/planner" element={<MealPlanner />} />
                <Route path="/create-recipe" element={<CreateRecipe />} />
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/profile" element={<Profile onLogout={() => { }} />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/history" element={<MealHistory />} />
                <Route path="/saved-lists" element={<SavedLists />} />
                <Route path="/water-log" element={<WaterLog />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/checkout/:plan" element={<Checkout />} />
                <Route path="/thank-you" element={<ThankYou />} />
              </Routes>
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppContent />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
