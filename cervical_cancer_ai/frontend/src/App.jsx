import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { Toaster } from './components/ui/toaster';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  // If loading is stuck at true, you see a blank screen or this spinner
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Initializing Secure Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {isAuthenticated ? <DashboardPage /> : <LoginPage />}
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;