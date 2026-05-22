
// API Utility for Crushrr Dating App

const API_BASE = '/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('crusherr_token');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      if (response.status >= 500) {
        throw new Error('Server is temporarily unavailable. Please try again later.');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    if (!response.ok) {
      const error = new Error(data.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}


// Upload file to server
export async function uploadFile(file, endpoint = '/upload/profile-pic') {
  const token = getAuthToken();
  
  const formData = new FormData();
  formData.append('profilePic', file);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: formData
  });
  
  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json')
    ? await response.json()
    : { error: await response.text() };
  
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  
  // Convert relative URL to full URL if needed
  if (data.url) {
    if (data.url.startsWith('/uploads/')) {
      data.url = window.location.origin + data.url;
    }
    // Handle relative URLs
    if (!data.url.startsWith('http') && !data.url.startsWith('//')) {
      data.url = window.location.origin + '/' + data.url;
    }
  }
  
  return data;
}

// Auth API
export const authAPI = {
  register: (userData) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  login: (credentials) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  googleLogin: (idToken) =>
    apiCall('/auth/google/login', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    }),

  googleRegister: (idToken) =>
    apiCall('/auth/google/register', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    })
};

// User API
export const userAPI = {
  getMe: () => apiCall('/user/me'),

  updateProfile: (profileData) =>
    apiCall('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
};

// Profiles API
export const profilesAPI = {
  getAll: () => apiCall('/profiles'),

  like: (profileId) =>
    apiCall('/profiles/like', {
      method: 'POST',
      body: JSON.stringify({ profileId })
    }),

  initDemo: async () => {
    const response = await fetch(`${API_BASE}/demo/init-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to init demo');
    return data;
  }
};

// Membership API
export const membershipAPI = {
  getPlans: () => apiCall('/membership/plans'),

  purchase: (planId) =>
    apiCall('/membership/purchase', {
      method: 'POST',
      body: JSON.stringify({ planId })
    })
};

// Coins API
export const coinsAPI = {
  getPackages: () => apiCall('/coins/packages'),

  addCoins: (amount) =>
    apiCall('/coins/add', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  withdraw: (amount) =>
    apiCall('/coins/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  updateUPI: (upiId) =>
    apiCall('/coins/upi', {
      method: 'POST',
      body: JSON.stringify({ upiId })
    }),

  getAdminSettings: () => apiCall('/public/settings'),

  getWithdrawSettings: () => apiCall('/public/withdraw-settings')
};

// Admin API
export const adminAPI = {
  getProfiles: () => apiCall('/admin/profiles'),

  addProfile: (profileData) =>
    apiCall('/admin/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    }),

  updateProfile: (id, profileData) =>
    apiCall(`/admin/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }),

  deleteProfile: (id) =>
    apiCall(`/admin/profiles/${id}`, {
      method: 'DELETE'
    }),

  deleteAllProfiles: () =>
    apiCall('/admin/profiles', {
      method: 'DELETE'
    }),

  getUsers: () => apiCall('/admin/users'),

  updateUserMembership: (userId, membership) =>
    apiCall(`/admin/users/${userId}/membership`, {
      method: 'PUT',
      body: JSON.stringify({ membership })
    }),

  updateUserCoins: (userId, loveCoins) =>
    apiCall(`/admin/users/${userId}/coins`, {
      method: 'PUT',
      body: JSON.stringify({ loveCoins })
    }),

  deductUserCoins: (userId, amount) =>
    apiCall(`/admin/users/${userId}/deduct-coins`, {
      method: 'PUT',
      body: JSON.stringify({ amount })
    }),

  resetUserMatches: (userId) =>
    apiCall(`/admin/users/${userId}/reset-matches`, {
      method: 'POST'
    }),

  deleteUser: (userId) =>
    apiCall(`/admin/users/${userId}`, {
      method: 'DELETE'
    }),

  updateUserBan: (userId, isBanned) =>
    apiCall(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ is_banned: isBanned })
    }),

  getSettings: () => apiCall('/admin/settings'),

  updateSettings: (settings) =>
    apiCall('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  initProfiles: () =>
    apiCall('/admin/init-profiles', {
      method: 'POST'
    })
};

// Storage helpers
export const storage = {
  setToken: (token) => localStorage.setItem('crusherr_token', token),
  getToken: () => localStorage.getItem('crusherr_token'),
  removeToken: () => localStorage.removeItem('crusherr_token'),
  
  setUser: (user) => localStorage.setItem('crusherr_user', JSON.stringify(user)),
  getUser: () => {
    try {
      const user = localStorage.getItem('crusherr_user');
      return user ? JSON.parse(user) : null;
    } catch {
      localStorage.removeItem('crusherr_user');
      return null;
    }
  },
  removeUser: () => localStorage.removeItem('crusherr_user'),
  
  clear: () => {
    localStorage.removeItem('crusherr_token');
    localStorage.removeItem('crusherr_user');
  }
};
