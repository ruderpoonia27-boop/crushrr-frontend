import React, { useState, useEffect } from 'react';
import { adminAPI, uploadFile } from '../api';
import { storage } from '../api';
import { getImageUrl, handleImageError } from '../imageUtils';

function Admin({ showToast }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVIP: 0,
    totalCoins: 0,
    totalProfiles: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Form states
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', bio: '', telegram: '', profile_pic: '', visibility: 'normal'
  });
  const [uploadingPic, setUploadingPic] = useState(false);
  
  // User edit state
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    membership: 'none',
    loveCoins: 0
  });
  
  // Profile delete selection state
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteCount, setDeleteCount] = useState('');

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVIP, setFilterVIP] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'dashboard') {
        const usersData = await adminAPI.getUsers();
        const profilesData = await adminAPI.getProfiles();
        const vipUsers = usersData.filter(u => u.membership && u.membership.includes('vip'));
        const totalCoins = usersData.reduce((sum, u) => sum + (u.love_coins || 0), 0);
        setStats({
          totalUsers: usersData.length,
          totalVIP: vipUsers.length,
          totalCoins: totalCoins,
          totalProfiles: profilesData.length
        });
        setUsers(usersData);
        setProfiles(profilesData);
      } else if (activeSection === 'profiles') {
        const data = await adminAPI.getProfiles();
        setProfiles(data);
      } else if (activeSection === 'users') {
        const data = await adminAPI.getUsers();
        setUsers(data);
      } else if (activeSection === 'settings') {
        const data = await adminAPI.getSettings();
        setSettings(data);
      }
    } catch (err) {
      showToast('Failed to load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Profile handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      if (editingProfile) {
        await adminAPI.updateProfile(editingProfile.id, profileForm);
        showToast('Profile updated!', 'success');
      } else {
        await adminAPI.addProfile(profileForm);
        showToast('Profile created!', 'success');
      }
      setShowProfileForm(false);
      setEditingProfile(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await adminAPI.deleteProfile(id);
      showToast('Profile deleted!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const editProfile = (profile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
      telegram: profile.telegram,
      profile_pic: profile.profile_pic,
      visibility: profile.visibility
    });
    setShowProfileForm(true);
  };
  
  // Profile selection handlers for bulk delete
  const toggleProfileSelection = (profileId) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };
  
  const handleDeleteSelectedProfiles = async () => {
    if (selectedProfiles.length === 0) {
      showToast('No profiles selected', 'error');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedProfiles.length} profile(s)? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      // Delete each selected profile
      for (const profileId of selectedProfiles) {
        await adminAPI.deleteProfile(profileId);
      }
      showToast(`${selectedProfiles.length} profile(s) deleted successfully`, 'success');
      setSelectedProfiles([]);
      setDeleteMode(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
  // Direct delete all without selection
  const handleDirectDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL profiles? This cannot be undone.')) return;
    
    try {
      const result = await adminAPI.deleteAllProfiles();
      showToast(result?.message || 'All profiles deleted!', 'success');
      loadData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // Delete first N profiles
  const handleDeleteFirstN = async () => {
    const countToDelete = parseInt(deleteCount);
    if (!countToDelete || countToDelete <= 0) {
      showToast('Please enter a valid number', 'error');
      return;
    }
    if (countToDelete > profiles.length) {
      showToast(`Only ${profiles.length} profiles available`, 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete first ${countToDelete} profiles?`)) return;
    
    try {
      // Get the first N profile IDs
      const profilesToDelete = profiles.slice(0, countToDelete);
      const idsToDelete = profilesToDelete.map(p => p.id);
      
      // Delete each profile
      for (const profileId of idsToDelete) {
        await adminAPI.deleteProfile(profileId);
      }
      
      showToast(`${countToDelete} profiles deleted!`, 'success');
      setDeleteCount('');
      loadData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedProfiles([]);
  };

  // Select all profiles
  const handleSelectAllProfiles = () => {
    const allProfileIds = profiles.map(p => p.id);
    setSelectedProfiles(allProfileIds);
    setDeleteMode(true);
  };

  // User handlers
  const handleUpdateMembership = async (userId, membership) => {
    try {
      await adminAPI.updateUserMembership(userId, membership);
      showToast('Membership updated!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateCoins = async (userId, newCoins) => {
    try {
      await adminAPI.updateUserCoins(userId, newCoins);
      showToast('Coins updated!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeductCoins = async (userId, amount) => {
    try {
      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount to deduct', 'error');
        return;
      }
      await adminAPI.deductUserCoins(userId, amount);
      showToast('Coins deducted successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResetMatches = async (userId) => {
    try {
      await adminAPI.resetUserMatches(userId);
      showToast('Matches reset!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user account from the app? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await adminAPI.deleteUser(userId);
      showToast('User deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBanUser = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUserBan(userId, !currentStatus);
      showToast(currentStatus ? 'User unbanned!' : 'User banned!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
  // User edit functions
  const openUserEdit = (user) => {
    setEditingUser(user);
    setUserForm({
      membership: user.membership || 'none',
      loveCoins: user.love_coins || 0
    });
    setShowUserEdit(true);
  };
  
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateUserMembership(editingUser.id, userForm.membership);
      await adminAPI.updateUserCoins(editingUser.id, userForm.loveCoins);
      showToast('User updated successfully!', 'success');
      setShowUserEdit(false);
      setEditingUser(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
  const handleDeleteUserFromEdit = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(editingUser.id);
      showToast('User deleted!', 'success');
      setShowUserEdit(false);
      setEditingUser(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Settings handlers
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateSettings(settings);
      showToast('Settings saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInitProfiles = async () => {
    try {
      await adminAPI.initProfiles();
      showToast('Sample profiles created!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    storage.clear();
    window.location.href = '/auth';
  };

  const membershipLabels = {
    'none': 'Free',
    'vip': 'VIP',
    'adult': '18+',
    'vip_adult': 'VIP + 18+'
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterVIP === 'all' || 
                         (filterVIP === 'vip' && user.membership?.includes('vip')) ||
                         (filterVIP === 'free' && (!user.membership || user.membership === 'none'));
    return matchesSearch && matchesFilter;
  });

  const renderSidebar = () => (
    <>
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>⚙️ Admin</h2>
        </div>
        <nav className="admin-sidebar-nav">
          <button 
            className={`admin-nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveSection('dashboard'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`admin-nav-btn ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveSection('users'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button 
            className={`admin-nav-btn ${activeSection === 'profiles' ? 'active' : ''}`}
            onClick={() => { setActiveSection('profiles'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📋</span>
            Profiles
          </button>
          <button 
            className={`admin-nav-btn ${activeSection === 'wallet' ? 'active' : ''}`}
            onClick={() => { setActiveSection('wallet'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">💰</span>
            Wallet Settings
          </button>
          <button 
            className={`admin-nav-btn ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveSection('settings'); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚙️</span>
            Site Settings
          </button>
          <div className="admin-sidebar-divider"></div>
          <button className="admin-nav-btn logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </nav>
      </div>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </>
  );

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2 className="section-title">Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card vip">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3>VIP Members</h3>
            <p className="stat-number">{stats.totalVIP}</p>
          </div>
        </div>
        <div className="stat-card coins">
          <div className="stat-icon">🪙</div>
          <div className="stat-content">
            <h3>Total Coins</h3>
            <p className="stat-number">{stats.totalCoins.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card profiles">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Profiles</h3>
            <p className="stat-number">{stats.totalProfiles}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-card" onClick={() => setActiveSection('profiles')}>
            <span className="action-icon">➕</span>
            <span>Add Profile</span>
          </button>
          <button className="action-card" onClick={() => setActiveSection('users')}>
            <span className="action-icon">🔍</span>
            <span>Manage Users</span>
          </button>
          <button className="action-card" onClick={() => setActiveSection('settings')}>
            <span className="action-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="recent-users">
        <h3>Recent Users</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Membership</th>
              <th>Coins</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 5).map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.membership?.includes('vip') ? 'badge-vip' : 'badge-premium'}`}>
                    {membershipLabels[user.membership] || 'Free'}
                  </span>
                </td>
                <td>🪙 {user.love_coins || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="section-header">
        <h2 className="section-title">User Management</h2>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={filterVIP}
            onChange={(e) => setFilterVIP(e.target.value)}
            className="form-input"
          >
            <option value="all">All Users</option>
            <option value="vip">VIP Only</option>
            <option value="free">Free Only</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Email</th>
            <th>Telegram</th>
            <th>Membership</th>
            <th>Coins</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>
                <div className="user-cell">
                  <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                  <span>{user.name}</span>
                </div>
              </td>
              <td className="td-email">{user.email}</td>
              <td>{user.telegram || '-'}</td>
              <td>
                <select
                  className={`membership-select ${user.membership !== 'none' ? 'vip' : ''}`}
                  value={user.membership || 'none'}
                  onChange={(e) => handleUpdateMembership(user.id, e.target.value)}
                >
                  <option value="none">Free</option>
                  <option value="vip">VIP</option>
                  <option value="adult">18+</option>
                  <option value="vip_adult">VIP + 18+</option>
                </select>
              </td>
              <td>
                <div className="coin-cell">
                  <span className="coin-balance">💰 {user.love_coins || 0}</span>
                  <div className="coin-actions">
                    <div className="coin-add">
                      <input
                        type="number"
                        className="coin-input"
                        placeholder="+"
                        id={`coins-${user.id}`}
                        min="0"
                      />
                      <button
                        className="btn btn-sm btn-outline btn-add-coin"
                        onClick={() => {
                          const input = document.getElementById(`coins-${user.id}`);
                          if (input.value) {
                            handleUpdateCoins(user.id, (user.love_coins || 0) + parseInt(input.value));
                          }
                        }}
                        title="Add Coins"
                      >
                        +
                      </button>
                    </div>
                    <div className="coin-deduct">
                      <input
                        type="number"
                        className="coin-input deduct"
                        placeholder="-"
                        id={`deduct-${user.id}`}
                        min="0"
                      />
                      <button
                        className="btn btn-sm btn-outline btn-deduct-coin"
                        onClick={() => {
                          const input = document.getElementById(`deduct-${user.id}`);
                          if (input.value) {
                            handleDeductCoins(user.id, parseInt(input.value));
                          }
                        }}
                        title="Deduct Coins"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td className="td-date">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => openUserEdit(user)}
                    title="Edit User"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleResetMatches(user.id)}
                    title="Reset Matches"
                  >
                    🔄
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleBanUser(user.id, user.is_banned)}
                    title={user.is_banned ? 'Unban User' : 'Ban User'}
                    style={user.is_banned ? {background: '#2ed573', borderColor: '#2ed573', color: 'white'} : {}}
                  >
                    {user.is_banned ? '✓' : '🚫'}
                  </button>
                  <button
                    className="btn-danger-sm"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Delete User"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}
    </div>
  );

  const renderProfiles = () => (
    <div className="admin-profiles">
      <div className="section-header">
        <h2 className="section-title">Profile Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {deleteMode ? (
            <>
              <button className="btn btn-danger-sm" onClick={handleDeleteSelectedProfiles}>
                🗑️ Delete Selected ({selectedProfiles.length})
              </button>
              <button className="btn btn-outline" onClick={cancelDeleteMode}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setDeleteMode(true)}>
                ☑️ Select to Delete
              </button>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Number"
              value={deleteCount}
              onChange={(e) => setDeleteCount(e.target.value)}
              style={{ width: '80px', padding: '0.5rem' }}
              min="1"
            />
            <button className="btn btn-danger" onClick={handleDeleteFirstN}>
              🗑️ Delete
            </button>
          </div>
          <button className="btn btn-danger" onClick={handleDirectDeleteAll}>
            🗑️ Delete All
          </button>
          <button className="btn btn-primary" onClick={handleSelectAllProfiles}>
            ☑️ Select All Profiles
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingProfile(null);
              setProfileForm({ name: '', age: '', bio: '', telegram: '', profile_pic: '', visibility: 'normal' });
              setShowProfileForm(true);
            }}
          >
            + Add Profile
          </button>
        </div>
      </div>
      
      {showProfileForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-3">{editingProfile ? 'Edit Profile' : 'Add New Profile'}</h4>
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadingPic(true);
                          try {
                            const result = await uploadFile(file);
                            setProfileForm({ ...profileForm, profile_pic: result.url });
                            showToast('Image uploaded!', 'success');
                          } catch (err) {
                            showToast('Upload failed: ' + err.message, 'error');
                          } finally {
                            setUploadingPic(false);
                          }
                        }
                      }}
                      disabled={uploadingPic}
                    />
                  </div>
                  {profileForm.profile_pic && (
                    <img src={getImageUrl(profileForm.profile_pic, profileForm.name)} alt="Preview" onError={(event) => handleImageError(event, profileForm.name)} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-input"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Telegram</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.telegram}
                    onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select
                    className="form-input"
                    value={profileForm.visibility}
                    onChange={(e) => setProfileForm({ ...profileForm, visibility: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="top">Top (VIP)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingProfile ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowProfileForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <table className="admin-table">
        <thead>
          <tr>
            {deleteMode && <th style={{ width: '40px' }}>✓</th>}
            <th>Photo</th>
            <th>Name</th>
            <th>Age</th>
            <th>Visibility</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(profile => (
            <tr key={profile.id} style={deleteMode ? { background: selectedProfiles.includes(profile.id) ? '#ffe6e6' : 'transparent' } : {}}>
              {deleteMode && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(profile.id)}
                    onChange={() => toggleProfileSelection(profile.id)}
                  />
                </td>
              )}
              <td>
                <img 
                  src={getImageUrl(profile.profile_pic, profile.name)} 
                  alt={profile.name}
                  onError={(event) => handleImageError(event, profile.name)}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </td>
              <td>{profile.name}</td>
              <td>{profile.age}</td>
              <td>
                <span className={`badge ${profile.visibility === 'top' ? 'badge-vip' : 'badge-premium'}`}>
                  {profile.visibility === 'top' ? '⭐ Top (VIP)' : '🔓 Normal'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn btn-sm btn-outline" onClick={() => editProfile(profile)}>
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-dark" 
                    onClick={() => handleDeleteProfile(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWallet = () => (
    <div className="admin-wallet">
      <h2 className="section-title">Telegram Links Settings</h2>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Configure Telegram links that users will be redirected to when clicking Deposit, Withdraw, VIP Purchase, 18+ Access, or Support buttons.
      </p>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">💰 Deposit Telegram Link</label>
              <input
                type="text"
                className="form-input"
                value={settings.depositTelegram || ''}
                onChange={(e) => setSettings({ ...settings, depositTelegram: e.target.value })}
                placeholder="e.g., crusherr_deposit or https://t.me/crusherr_deposit"
              />
              <small className="form-help">Users will be redirected to this Telegram when clicking Deposit</small>
            </div>
            <div className="form-group">
              <label className="form-label">💸 Withdraw Telegram Link</label>
              <input
                type="text"
                className="form-input"
                value={settings.withdrawTelegram || ''}
                onChange={(e) => setSettings({ ...settings, withdrawTelegram: e.target.value })}
                placeholder="e.g., crusherr_withdraw or https://t.me/crusherr_withdraw"
              />
              <small className="form-help">Users will be redirected to this Telegram when clicking Withdraw</small>
            </div>
            <div className="form-group">
              <label className="form-label">👑 VIP Purchase Telegram Link</label>
              <input
                type="text"
                className="form-input"
                value={settings.vipTelegram || ''}
                onChange={(e) => setSettings({ ...settings, vipTelegram: e.target.value })}
                placeholder="e.g., crusherr_vip or https://t.me/crusherr_vip"
              />
              <small className="form-help">Users will contact this Telegram to purchase VIP membership</small>
            </div>
            <div className="form-group">
              <label className="form-label">🔞 18+ Access Telegram Link</label>
              <input
                type="text"
                className="form-input"
                value={settings.adultTelegram || ''}
                onChange={(e) => setSettings({ ...settings, adultTelegram: e.target.value })}
                placeholder="e.g., crusherr_adult or https://t.me/crusherr_adult"
              />
              <small className="form-help">Users will contact this Telegram to get 18+ content access</small>
            </div>
            <div className="form-group">
              <label className="form-label">🎧 Support Telegram Link</label>
              <input
                type="text"
                className="form-input"
                value={settings.supportTelegram || ''}
                onChange={(e) => setSettings({ ...settings, supportTelegram: e.target.value })}
                placeholder="e.g., crusherr_support or https://t.me/crusherr_support"
              />
              <small className="form-help">Users will contact this Telegram for support</small>
            </div>
            <button type="submit" className="btn btn-primary">
              Save Telegram Links
            </button>
          </form>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h3>Quick Stats</h3>
          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <div className="stat-icon">🪙</div>
              <div className="stat-content">
                <h3>Total Coins</h3>
                <p className="stat-number">{stats.totalCoins.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Active Users</h3>
                <p className="stat-number">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Avg Coins/User</h3>
                <p className="stat-number">{stats.totalUsers > 0 ? Math.round(stats.totalCoins / stats.totalUsers) : 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Edit Modal */}
      {showUserEdit && editingUser && (
        <div className="modal-overlay" onClick={() => setShowUserEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit User</h3>
              <button className="modal-close" onClick={() => setShowUserEdit(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-info-card">
                <p><strong>Name:</strong> {editingUser.name}</p>
                <p><strong>Email:</strong> {editingUser.email}</p>
                <p><strong>Member Since:</strong> {editingUser.created_at ? new Date(editingUser.created_at).toLocaleDateString() : '-'}</p>
              </div>
              
              <form onSubmit={handleSaveUser}>
                <div className="form-group">
                  <label className="form-label">👑 Membership</label>
                  <select
                    className="form-input"
                    value={userForm.membership}
                    onChange={(e) => setUserForm({ ...userForm, membership: e.target.value })}
                  >
                    <option value="none">Free</option>
                    <option value="vip">VIP</option>
                    <option value="adult">18+ Only</option>
                    <option value="vip_adult">VIP + 18+</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">🪙 Love Coins</label>
                  <input
                    type="number"
                    className="form-input"
                    value={userForm.loveCoins}
                    onChange={(e) => setUserForm({ ...userForm, loveCoins: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    💾 Save Changes
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowUserEdit(false)}>
                    Cancel
                  </button>
                </div>
              </form>
              
              <hr style={{ margin: '1.5rem 0' }} />
              
              <div className="danger-zone">
                <h4>⚠️ Danger Zone</h4>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteUserFromEdit}
                >
                  🗑️ Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="admin-settings">
      <h2 className="section-title">Site Settings</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">📢 Homepage Notice</label>
              <textarea
                className="form-input"
                value={settings.notice || ''}
                onChange={(e) => setSettings({ ...settings, notice: e.target.value })}
                rows={3}
                placeholder="Enter announcement or notice text..."
              />
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.noticeEnabled || false}
                  onChange={(e) => setSettings({ ...settings, noticeEnabled: e.target.checked })}
                />
                <span className="toggle-switch"></span>
                <span>Show Notice Banner</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              Save Site Settings
            </button>
          </form>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h3>System Info</h3>
          <div className="system-info">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Platform:</strong> Crusherr Dating App</p>
            <p><strong>Backend:</strong> Node.js + Express</p>
            <p><strong>Database:</strong> Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      {renderSidebar()}
      <div className="admin-main">
        <div className="mobile-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h2 className="mobile-title">Admin Panel</h2>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'users' && renderUsers()}
            {activeSection === 'profiles' && renderProfiles()}
            {activeSection === 'wallet' && renderWallet()}
            {activeSection === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
