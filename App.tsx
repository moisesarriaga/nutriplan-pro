
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './screens/Dashboard';
import Search from './screens/Search';
import RecipeDetails from './screens/RecipeDetails';
import MealPlanner from './screens/MealPlanner';
import CreateRecipe from './screens/CreateRecipe';
import ShoppingCart from './screens/ShoppingCart';
import Profile from './screens/Profile';
import Login from './screens/Login';
import Register from './screens/Register';
import Favorites from './screens/Favorites';
import MealHistory from './screens/MealHistory';
import SavedLists from './screens/SavedLists';
import WaterLog from './screens/WaterLog';
import Notifications from './screens/Notifications';
import Scan from './screens/Scan';
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
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={() => { }} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onRegister={() => { }} />} />

        <Route
          path="/"
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
