import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { storage, userAPI } from './api';

// Pages
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import ProfileView from './pages/ProfileView';
import Membership from './pages/Membership';
import PremiumProfiles from './pages/PremiumProfiles';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';

// Components
import Navbar from './components/Navbar';
import Toast from './components/Toast';

// Component to refresh user data on route changes
function UserDataRefresher({ user, onUserUpdate }) {
  const location = useLocation();
  const userId = user?.id;
  
  useEffect(() => {
    // Refresh user data when navigating to protected routes
    const refreshUserData = async () => {
      try {
        const freshUser = await userAPI.getMe();
        onUserUpdate(freshUser);
        storage.setUser(freshUser);
      } catch (err) {
        console.error('Failed to refresh user data:', err);
      }
    };
    
    // Only refresh on main protected routes (not admin)
    const protectedRoutes = ['/dashboard', '/profile', '/membership', '/premium-profiles', '/wallet'];
    if (protectedRoutes.includes(location.pathname) && userId) {
      refreshUserData();
    }
  }, [location.pathname, userId, onUserUpdate]);
  
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  // Refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      const freshUser = await userAPI.getMe();
      setUser(freshUser);
      storage.setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Check for existing auth and refresh user data
    const initAuth = async () => {
      const storedUser = storage.getUser();
      const storedToken = storage.getToken();
      if (storedUser && storedToken) {
        setUser(storedUser);
        // Try to refresh user data from server
        try {
          const freshUser = await userAPI.getMe();
          setUser(freshUser);
          storage.setUser(freshUser);
        } catch (err) {
          if (err.status === 401 || err.status === 403) {
            storage.clear();
            setUser(null);
          } else {
            console.log('Using cached user data');
          }
        }
      } else if (!storedToken) {
        storage.clear();
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleLogin = (userData, token) => {
    storage.setToken(token);
    storage.setUser(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    storage.clear();
    setUser(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Crushrr...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <UserDataRefresher user={user} onUserUpdate={setUser} />
        
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Toast 
          message={toast.message} 
          type={toast.type} 
          show={toast.show} 
        />

        <Routes>
          <Route 
            path="/auth" 
            element={!user ? <Auth onLogin={handleLogin} showToast={showToast} /> : <Navigate to="/dashboard" />} 
          />
          
          <Route 
            path="/profile-setup" 
            element={user ? (user.profileCompleted ? <Navigate to="/dashboard" /> : <ProfileSetup user={user} onProfileUpdate={handleProfileUpdate} showToast={showToast} />) : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/dashboard" 
            element={user && user.profileCompleted ? <Dashboard user={user} showToast={showToast} onUserUpdate={refreshUserData} /> : user ? <Navigate to="/profile-setup" /> : <Dashboard user={null} showToast={showToast} onUserUpdate={refreshUserData} />} 
          />
          
          <Route 
            path="/profile" 
            element={user && user.profileCompleted ? <ProfileView user={user} onProfileUpdate={handleProfileUpdate} showToast={showToast} /> : user ? <Navigate to="/profile-setup" /> : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/membership" 
            element={user && user.profileCompleted ? <Membership user={user} onProfileUpdate={handleProfileUpdate} showToast={showToast} onUserUpdate={refreshUserData} /> : user ? <Navigate to="/profile-setup" /> : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/premium-profiles" 
            element={user && user.profileCompleted ? <PremiumProfiles user={user} showToast={showToast} /> : user ? <Navigate to="/profile-setup" /> : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/wallet" 
            element={user && user.profileCompleted ? <Wallet user={user} onProfileUpdate={handleProfileUpdate} showToast={showToast} onUserUpdate={refreshUserData} /> : user ? <Navigate to="/profile-setup" /> : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/admin" 
            element={user && user.email === 'admin@crushrr.com' ? <Admin showToast={showToast} /> : <Navigate to="/dashboard" />} 
          />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
