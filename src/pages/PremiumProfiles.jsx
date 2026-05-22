import React, { useState, useEffect } from 'react';
import { profilesAPI } from '../api';
import { Navigate, useNavigate } from 'react-router-dom';

function PremiumProfiles({ user, showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';

  const getImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/400x500?text=No+Image';
    if (url.startsWith('http')) return url;
    return window.location.origin + url;
  };
  
  useEffect(() => {
    loadProfiles();
  }, []);
  
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await profilesAPI.getAll();
      setProfiles(data.premiumProfiles || []);
    } catch (err) {
      showToast('Failed to load profiles', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLike = async (profileId, telegram) => {
    try {
      const result = await profilesAPI.like(profileId);
      
      if (result.telegram) {
        const telegramLink = result.telegram.startsWith('@') 
          ? `https://t.me/${result.telegram.substring(1)}`
          : `https://t.me/${result.telegram}`;
        
        window.open(telegramLink, '_blank');
        showToast('Opening Telegram chat...', 'success');
      }
      
      loadProfiles();
    } catch (err) {
      if (err.message.includes('VIP required')) {
        navigate('/membership');
      } else {
        showToast(err.message, 'error');
      }
    }
  };
  
  const renderProfileCard = (profile) => (
    <div key={profile.id} className={`profile-card ${!isVIP ? 'blurred' : ''}`}>
      <img 
        src={getImageUrl(profile.profile_pic)} 
        alt={profile.name}
        className="profile-card-image"
      />
      {!isVIP && (
        <div className="vip-lock-overlay">
          <div className="lock-icon">🔒</div>
          <p>VIP Required</p>
          <button className="btn btn-vip" onClick={() => navigate('/membership')}>
            👑 Upgrade to VIP
          </button>
        </div>
      )}
      <div className="profile-card-body">
        <h4 className="profile-card-name">
          {profile.name}
          <span className="badge badge-vip">👑 VIP</span>
        </h4>
        <p className="profile-card-age">{profile.age} years old</p>
        <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {profile.bio?.substring(0, 80)}...
        </p>
        <div className="profile-card-actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => isVIP ? setSelectedProfile(profile) : navigate('/membership')}
          >
            👁 See Details
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleLike(profile.id, profile.telegram)}
          >
            💬 Chat
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-spinner"></div>
          <p>Loading premium profiles...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="premium-profiles-page">
      {/* Header */}
      <div className="premium-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="premium-title">
          <span>👑</span> Premium Profiles
        </h1>
        <p className="premium-subtitle">
          {isVIP ? 'Connect with premium members' : 'Upgrade to VIP to connect'}
        </p>
      </div>
      
      {!isVIP && (
        <div className="vip-promo-card">
          <div className="vip-promo-icon">🔒</div>
          <h3>VIP Required</h3>
          <p>Upgrade to VIP to view and connect with these premium profiles!</p>
          <button 
            className="btn btn-vip"
            onClick={() => navigate('/membership')}
          >
            👑 Upgrade to VIP
          </button>
        </div>
      )}
      
      {/* Profiles Grid */}
      <div className="premium-profiles-grid">
        {profiles.map(profile => renderProfileCard(profile))}
      </div>
      
      {/* Empty State */}
      {profiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👑</div>
          <h3>No Premium Profiles</h3>
          <p>Check back later for new premium matches!</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
            ← Go to Dashboard
          </button>
        </div>
      )}

      {selectedProfile && (
        <div className="premium-modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="profile-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="premium-modal-close" onClick={() => setSelectedProfile(null)}>×</button>
            <div className="profile-detail-image">
              <img src={getImageUrl(selectedProfile.profile_pic)} alt={selectedProfile.name} />
              <div className="profile-detail-vip-badge">VIP</div>
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
              <button
                className="btn btn-primary btn-block mt-3"
                onClick={() => handleLike(selectedProfile.id, selectedProfile.telegram)}
              >
                Chat on Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumProfiles;
