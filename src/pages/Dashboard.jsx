import React, { useState, useEffect } from 'react';
import { profilesAPI, userAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, handleImageError } from '../imageUtils';

function Dashboard({ user, showToast, onUserUpdate }) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({ premiumProfiles: [], normalProfiles: [], isVIP: false });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const navigate = useNavigate();
  
  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';
  
  useEffect(() => {
    // Refresh user data when component mounts (to get admin updates) - only if logged in
    if (user && onUserUpdate) {
      onUserUpdate();
    }
    loadProfiles();
  }, []);
  
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await profilesAPI.getAll();
      console.log('Profiles loaded:', data);
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      showToast?.('Could not refresh profiles. Showing the last loaded profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLike = async (profileId, telegram) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      const result = await profilesAPI.like(profileId);
      
      if (result.telegram) {
        const telegramLink = result.telegram.startsWith('@') 
          ? `https://t.me/${result.telegram.substring(1)}`
          : `https://t.me/${result.telegram}`;
        
        window.open(telegramLink, '_blank');
        showToast('Opening Telegram chat...', 'success');
      }
      
      // Refresh profiles
      loadProfiles();
    } catch (err) {
      if (err.message.includes('VIP required')) {
        navigate('/membership');
      } else {
        showToast(err.message, 'error');
      }
    }
  };
  
  const handleViewProfile = (profile) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedProfile(profile);
  };
  
  const renderProfileCard = (profile, isBlurred = false) => (
    <div key={profile.id} className={`dating-card ${isBlurred ? 'blurred' : ''}`}>
      <div className="dating-card-image-wrapper">
        <img 
          src={getImageUrl(profile.profile_pic, profile.name)} 
          alt={profile.name}
          className="dating-card-image"
          onError={(event) => handleImageError(event, profile.name)}
        />
        {isBlurred && (
          <div className="vip-lock-overlay">
            <div className="lock-icon">🔒</div>
            <p>VIP Required</p>
            <button className="btn btn-vip" onClick={() => navigate('/membership')}>
              👑 Upgrade to VIP
            </button>
          </div>
        )}
      </div>
      <div className="dating-card-content">
        <h4 className="dating-card-name">
          {profile.name}
          {profile.visibility === 'top' && <span className="badge badge-vip">👑 VIP</span>}
        </h4>
        <p className="dating-card-age">{profile.age} years old</p>
        {profile.bio && (
          <p className="dating-card-bio">{profile.bio.substring(0, 60)}...</p>
        )}
        <div className="dating-card-actions">
          {isBlurred ? (
            <button className="btn btn-vip btn-block" onClick={() => navigate('/membership')}>
              👑 Unlock with VIP
            </button>
          ) : (
            <>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => handleViewProfile(profile)}
              >
                👁 See Details
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleLike(profile.id, profile.telegram)}
              >
                💬 Chat
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-spinner"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-emoji">💕</span> {user ? `Hey ${user.name}!` : 'Welcome to Crushrr!'}
          </h1>
          <p className="hero-subtitle">{user ? 'Find your perfect match today' : 'Find your perfect match today'}</p>
          {!user && (
            <button className="btn btn-primary mt-3" onClick={() => navigate('/auth')}>
              🔐 Sign In to Connect
            </button>
          )}
        </div>
        <div className="hero-decoration">
          <span className="floating-heart">❤️</span>
          <span className="floating-heart">💖</span>
          <span className="floating-heart">💕</span>
        </div>
      </div>
      
      {/* Premium Profiles Section */}
      {profiles.premiumProfiles && profiles.premiumProfiles.length > 0 && (
        <div className="dashboard-section premium-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">👑</span>
              Premium Matches
            </h3>
            <span className="section-badge">VIP Only</span>
          </div>
          <div className="profiles-scroll">
            {profiles.premiumProfiles.slice(0, 4).map(profile => 
              renderProfileCard(profile, !isVIP)
            )}
            {profiles.premiumProfiles.length > 4 && (
              <div 
                className="dating-card show-more-card" 
                onClick={() => navigate('/premium-profiles')}
              >
                <div className="show-more-content">
                  <div className="show-more-icon">→</div>
                  <h4>View All</h4>
                  <p>{profiles.premiumProfiles.length} Premium Profiles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Normal Profiles Section */}
      {profiles.normalProfiles && profiles.normalProfiles.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">✨</span>
              Explore Profiles
            </h3>
          </div>
          <div className="profiles-grid">
            {profiles.normalProfiles.map(profile => 
              renderProfileCard(profile, false)
            )}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {(!profiles.premiumProfiles || profiles.premiumProfiles.length === 0) && 
       (!profiles.normalProfiles || profiles.normalProfiles.length === 0) && (
        <div className="empty-state">
          <div className="empty-state-icon">💔</div>
          <h3>No profiles yet</h3>
          <p>We're finding perfect matches for you!</p>
          <button className="btn btn-primary mt-3" onClick={loadProfiles}>
            🔄 Check Again
          </button>
        </div>
      )}
      
      {/* Profile Details Modal */}
      {selectedProfile && (
        <div className="premium-modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="profile-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setSelectedProfile(null)}>×</button>
            
            <div className="profile-detail-image">
              <img 
                src={getImageUrl(selectedProfile.profile_pic, selectedProfile.name)} 
                alt={selectedProfile.name}
                onError={(event) => handleImageError(event, selectedProfile.name)}
              />
              {selectedProfile.visibility === 'top' && (
                <div className="profile-detail-vip-badge">👑 VIP</div>
              )}
            </div>
            
            <div className="profile-detail-content">
              <h2>{selectedProfile.name}</h2>
              <p className="profile-detail-age">{selectedProfile.age} years old</p>
              
              <div className="profile-detail-section">
                <h4>About Me</h4>
                <p>{selectedProfile.bio || 'No bio available'}</p>
              </div>
              
              {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                <div className="profile-detail-section">
                  <h4>Interests</h4>
                  <div className="profile-detail-hobbies">
                    {selectedProfile.hobbies.map((hobby, index) => (
                      <span key={index} className="hobby-tag">{hobby}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="profile-detail-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setSelectedProfile(null)}
                >
                  ← Back
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if (selectedProfile.telegram) {
                      const telegramLink = selectedProfile.telegram.startsWith('@') 
                        ? `https://t.me/${selectedProfile.telegram.substring(1)}`
                        : `https://t.me/${selectedProfile.telegram}`;
                      window.open(telegramLink, '_blank');
                    }
                  }}
                >
                  💬 Chat on Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
