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
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={() => { }} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onRegister={() => { }} />} />

        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/search"
          element={user ? <Search /> : <Navigate to="/login" />}
        />
        <Route
          path="/recipe/:id"
          element={user ? <RecipeDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/planner"
          element={user ? <MealPlanner /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-recipe"
          element={user ? <CreateRecipe /> : <Navigate to="/login" />}
        />
        <Route
          path="/cart"
          element={user ? <ShoppingCart /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile onLogout={() => { }} /> : <Navigate to="/login" />}
        />
        <Route
          path="/favorites"
          element={user ? <Favorites /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={user ? <MealHistory /> : <Navigate to="/login" />}
        />
        <Route
          path="/saved-lists"
          element={user ? <SavedLists /> : <Navigate to="/login" />}
        />
        <Route
          path="/water-log"
          element={user ? <WaterLog /> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications"
          element={user ? <Notifications /> : <Navigate to="/login" />}
        />
        <Route
          path="/scan"
          element={user ? <Scan /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
