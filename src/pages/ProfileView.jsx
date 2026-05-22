import React, { useState } from 'react';
import { userAPI, uploadFile } from '../api';
import { Navigate } from 'react-router-dom';

const HOBBIES = [
  'Travel', 'Music', 'Photography', 'Cooking', 'Reading',
  'Fitness', 'Gaming', 'Movies', 'Art', 'Dancing',
  'Hiking', 'Yoga', 'Sports', 'Fashion', 'Technology',
  'Coffee', 'Dogs', 'Cats', 'Shopping', 'Writing'
];

// Helper to get full image URL
const getImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/150x150?text=No+Image';
  if (url.startsWith('http')) return url;
  return window.location.origin + url;
};

function ProfileView({ user, onProfileUpdate, showToast }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    bio: user?.bio || '',
    telegram: user?.telegram || '',
    hobbies: user?.hobbies || [],
    profilePic: user?.profilePic || ''
  });
  
  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const toggleHobby = (hobby) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const { user: updatedUser } = await userAPI.updateProfile(formData);
      onProfileUpdate(updatedUser);
      setEditing(false);
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="profile-view-page">
      <div className="profile-header">
        <img 
          src={getImageUrl(user.profilePic)} 
          alt={user.name}
          className="profile-avatar"
        />
        <h2>{user.name}</h2>
        <p className="text-secondary">{user.email}</p>
        {isVIP && <span className="badge badge-vip mt-2">👑 VIP Member</span>}
      </div>
      
      <div className="profile-info">
        {!editing ? (
          <>
            <div className="card-body">
              <h5 className="mb-3">Profile Info</h5>
              <p><strong>Age:</strong> {user.age || 'Not set'} years</p>
              <p><strong>Telegram:</strong> {user.telegram || 'Not set'}</p>
              <p><strong>Bio:</strong> {user.bio || 'Not set'}</p>
              {user?.hobbies && user.hobbies.length > 0 && (
                <div className="mt-3">
                  <strong>Interests:</strong>
                  <div className="interest-tags mt-2">
                    {user.hobbies.map(hobby => (
                      <span key={hobby} className="interest-tag">{hobby}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="card-footer">
              <div className="wallet-card" style={{ padding: '1rem', marginBottom: 0 }}>
                <div className="wallet-balance" style={{ fontSize: '1.5rem' }}>
                  🪙 {user.loveCoins || 0} Love Coins
                </div>
              </div>
              <div className="mt-3">
                <button 
                  className="btn btn-outline btn-block"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                className="form-input"
                value={formData.age}
                onChange={handleChange}
                min="18"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Profile Picture</label>
              <div className="profile-upload-container">
                <div className="profile-preview-wrapper">
                  {formData.profilePic ? (
                    <div className="profile-preview">
                      <img 
                        src={getImageUrl(formData.profilePic)} 
                        alt="Preview" 
                        className="preview-image"
                      />
                      <div className="preview-overlay">
                        <span>Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-placeholder">
                      <span className="placeholder-icon">📷</span>
                      <span className="placeholder-text">Upload Photo</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="upload-loading">
                      <div className="loading-spinner"></div>
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="profile-upload-input"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploading(true);
                      try {
                        const result = await uploadFile(file);
                        setFormData(prev => ({ ...prev, profilePic: result.url }));
                        showToast('Photo uploaded!', 'success');
                      } catch (err) {
                        showToast('Upload failed: ' + err.message, 'error');
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                  disabled={uploading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                className="form-input"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Telegram Username</label>
              <input
                type="text"
                name="telegram"
                className="form-input"
                value={formData.telegram}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Interests</label>
              <div className="hobbies-grid">
                {HOBBIES.map(hobby => (
                  <div
                    key={hobby}
                    className={`hobby-option ${formData.hobbies.includes(hobby) ? 'selected' : ''}`}
                    onClick={() => toggleHobby(hobby)}
                  >
                    {hobby}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-3" style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfileView;
