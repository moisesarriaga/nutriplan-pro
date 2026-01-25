import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AlertModal from './components/AlertModal';
import ConfirmationModal from './components/ConfirmationModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Lazy load screens for performance optimization
const Dashboard = lazy(() => import('./nutriplan-pro/screens/Dashboard'));
const Search = lazy(() => import('./nutriplan-pro/screens/Search'));
const RecipeDetails = lazy(() => import('./nutriplan-pro/screens/RecipeDetails'));
const MealPlanner = lazy(() => import('./nutriplan-pro/screens/MealPlanner'));
const CreateRecipe = lazy(() => import('./nutriplan-pro/screens/CreateRecipe'));
const ShoppingCart = lazy(() => import('./nutriplan-pro/screens/ShoppingCart'));
const ShoppingListDetail = lazy(() => import('./nutriplan-pro/screens/ShoppingListDetail'));
const Profile = lazy(() => import('./nutriplan-pro/screens/Profile'));
const Login = lazy(() => import('./nutriplan-pro/screens/Login'));
const Register = lazy(() => import('./nutriplan-pro/screens/Register'));
const Favorites = lazy(() => import('./nutriplan-pro/screens/Favorites'));
const MyRecipes = lazy(() => import('./nutriplan-pro/screens/MyRecipes'));
const MealHistory = lazy(() => import('./nutriplan-pro/screens/MealHistory'));
const SavedLists = lazy(() => import('./nutriplan-pro/screens/SavedLists'));
const WaterLog = lazy(() => import('./nutriplan-pro/screens/WaterLog'));
const WaterHistory = lazy(() => import('./nutriplan-pro/screens/WaterHistory'));
const Notifications = lazy(() => import('./nutriplan-pro/screens/Notifications'));
const Scan = lazy(() => import('./nutriplan-pro/screens/Scan'));
const LandingPage = lazy(() => import('./nutriplan-pro/screens/LandingPage'));
const Checkout = lazy(() => import('./nutriplan-pro/screens/Checkout'));
const ThankYou = lazy(() => import('./nutriplan-pro/screens/ThankYou'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

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
    return <LoadingFallback />;
  }

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
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
                    <Route path="/cart/:listId" element={<ShoppingListDetail />} />
                    <Route path="/profile" element={<Profile onLogout={() => { }} />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/my-recipes" element={<MyRecipes />} />
                    <Route path="/history" element={<MealHistory />} />
                    <Route path="/saved-lists" element={<SavedLists />} />
                    <Route path="/water-log" element={<WaterLog />} />
                    <Route path="/water-history" element={<WaterHistory />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/scan" element={<Scan />} />
                    <Route path="/checkout/:plan" element={<Checkout />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
      <AlertModal />
      <ConfirmationModal />
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AppContent />
              <SpeedInsights />
            </SubscriptionProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
