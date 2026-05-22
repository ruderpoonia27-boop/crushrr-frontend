import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getImageUrl, handleImageError } from '../imageUtils';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';
  
  const isActive = (path) => location.pathname === path ? 'active' : '';
  
  // Guard clause for when user is not available
  if (!user) return null;
  
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          <span>💕</span>
          <span>Crushrr</span>
        </Link>
        
        <div className="navbar-nav">
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
            🏠 Home
          </Link>
          <Link to="/premium-profiles" className={`navbar-link ${isActive('/premium-profiles')}`}>
            ⭐ Premium
          </Link>
          <Link to="/membership" className={`navbar-link ${isActive('/membership')}`}>
            👑 VIP
          </Link>
          <Link to="/wallet" className={`navbar-link ${isActive('/wallet')}`}>
            💰 Wallet
          </Link>
          {user?.email === 'admin@crushrr.com' && (
            <Link to="/admin" className={`navbar-link ${isActive('/admin')}`}>
              ⚙️ Admin
            </Link>
          )}
        </div>
        
        <div className="navbar-user">
          <div className="navbar-coins">
            🪙 {user?.loveCoins || 0}
          </div>
          <Link to="/profile">
            <img 
              src={getImageUrl(user?.profilePic, user?.name || 'User')} 
              alt={user?.name || 'User'} 
              className="navbar-avatar"
              onError={(event) => handleImageError(event, user?.name || 'User')}
            />
          </Link>
          <button className="btn btn-sm btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
