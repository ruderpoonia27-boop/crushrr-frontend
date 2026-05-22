import React, { useState } from 'react';
import { userAPI, uploadFile } from '../api';

const HOBBIES = [
  'Travel', 'Music', 'Photography', 'Cooking', 'Reading',
  'Fitness', 'Gaming', 'Movies', 'Art', 'Dancing',
  'Hiking', 'Yoga', 'Sports', 'Fashion', 'Technology',
  'Coffee', 'Dogs', 'Cats', 'Shopping', 'Writing'
];

function ProfileSetup({ user, onProfileUpdate, showToast }) {
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
    
    if (!formData.name) {
      showToast('Please enter your name', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { user: updatedUser } = await userAPI.updateProfile(formData);
      onProfileUpdate(updatedUser);
      showToast('Profile created!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page">
      <div className="auth-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h1>Complete Your Profile</h1>
            <p>Tell us about yourself</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                className="form-input"
                placeholder="Your age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="99"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Profile Picture</label>
              <div className="profile-upload-container">
                <div className="profile-preview-wrapper">
                  {formData.profilePic ? (
                    <div className="profile-preview">
                      <img 
                        src={formData.profilePic} 
                        alt="Preview" 
                        className="preview-image"
                        onError={(e) => { e.target.style.display = 'none'; }}
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
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Telegram Username</label>
              <input
                type="text"
                name="telegram"
                className="form-input"
                placeholder="your_username (without @)"
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
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
