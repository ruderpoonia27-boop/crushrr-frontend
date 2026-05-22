import React, { useState, useEffect } from 'react';
import { membershipAPI, coinsAPI } from '../api';
import { Navigate } from 'react-router-dom';

// Custom 18+ features to display at top of card
const adultFeatures = [
  { icon: '📍', text: 'Enjoy nearest 18+ services' },
  { icon: '🎯', text: 'Access age-restricted profiles' },
  { icon: '👁️', text: 'View locked profiles without blur' },
  { icon: '🔥', text: 'Separate 18+ browsing section' },
  { icon: '⚡', text: 'Priority Telegram redirect' }
];

// Regular VIP features
const vipFeatures = [
  { icon: '❤️', text: 'Unlimited Likes' },
  { icon: '⭐', text: 'Premium Profiles' },
  { icon: '👑', text: 'VIP Badge' },
  { icon: '✨', text: 'Super Likes' },
  { icon: '🎁', text: 'Exclusive Offers' }
];

function Membership({ user, onProfileUpdate, showToast, onUserUpdate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  
  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';
  const isAdult = user?.membership === 'vip_adult';
  
  useEffect(() => {
    // Refresh user data when component mounts
    if (onUserUpdate) {
      onUserUpdate();
    }
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      // Load admin settings for Telegram links
      const settingsData = await coinsAPI.getAdminSettings();
      setSettings(settingsData || {});
      
      // Load plans (for display only, actual purchase goes to Telegram)
      const data = await membershipAPI.getPlans();
      setPlans(data.plans);
    } catch (err) {
      // Continue without settings
      setPlans([
        { id: 'vip', name: 'VIP', features: ['Unlimited Likes', 'Premium Profiles', 'VIP Badge'] },
        { id: 'vip_adult', name: 'VIP + 18+', features: ['All VIP Features', '18+ Content Access'] }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to open Telegram link
  const openTelegramLink = (telegramUsername) => {
    if (!telegramUsername) {
      showToast('Telegram link not configured', 'error');
      return;
    }
    
    let telegramLink = telegramUsername.trim();
    
    // If it's already a full URL, use it as-is
    if (telegramLink.startsWith('http://') || telegramLink.startsWith('https://')) {
      window.open(telegramLink, '_blank');
    } 
    // If it starts with t.me, add https://
    else if (telegramLink.startsWith('t.me/')) {
      window.open('https://' + telegramLink, '_blank');
    }
    // If it has @, remove it and create t.me link
    else if (telegramLink.startsWith('@')) {
      window.open('https://t.me/' + telegramUsername.replace('@', ''), '_blank');
    }
    // Otherwise, assume it's a username
    else {
      window.open('https://t.me/' + telegramLink, '_blank');
    }
  };
  
  const handlePurchase = (planId) => {
    let telegramLink;
    
    if (planId === 'vip_adult') {
      telegramLink = settings.adultTelegram || settings.vipTelegram || 'crusherr_vip';
    } else {
      telegramLink = settings.vipTelegram || 'crusherr_vip';
    }
    
    openTelegramLink(telegramLink);
    showToast('Opening Telegram to complete purchase...', 'info');
  };
  
  const renderButton = (plan) => {
    if (plan.id === 'vip' && isVIP && !isAdult) {
      return (
        <button className="btn btn-vip btn-block" disabled>
          Current Plan
        </button>
      );
    }
    if (plan.id === 'vip_adult' && isAdult) {
      return (
        <button className="btn btn-vip btn-block" disabled>
          Current Plan
        </button>
      );
    }
    return (
      <button 
        id={plan.id === 'vip_adult' ? 'adult-btn' : 'vip-btn'}
        className={`btn btn-block ${plan.id === 'vip_adult' ? 'btn-vip btn-adult-cta' : 'btn-primary'}`}
        onClick={() => handlePurchase(plan.id)}
      >
        {plan.id === 'vip_adult' ? '🔞 Unlock 18+ Access' : '👑 Go Premium'}
      </button>
    );
  };
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="membership-page">
      <div className="text-center mb-4">
        <h1>👑 VIP Membership</h1>
        <p className="text-secondary">Unlock premium features and get more matches!</p>
      </div>
      
      {isVIP && (
        <div className="vip-banner">
          <div className="vip-banner-content">
            <span className="vip-crown">👑</span>
            <div>
              <h3>You're a VIP Member!</h3>
              <p>Thank you for your support. Enjoy all premium features.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="premium-plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`premium-plan-card ${plan.id === 'vip_adult' ? 'premium-plus' : ''} ${plan.id === 'vip' && !isAdult ? 'featured' : ''}`}
          >
            {plan.id === 'vip_adult' && <div className="premium-badge adult-badge">🔞 18+</div>}
            {plan.id === 'vip' && !isAdult && <div className="featured-badge">POPULAR</div>}
            
            <div className="premium-plan-header">
              <div className="plan-icon">
                {plan.id === 'vip_adult' ? '🔞' : '👑'}
              </div>
              <h3 className="premium-plan-name">{plan.name}</h3>
              <p className="premium-plan-tagline">
                {plan.id === 'vip_adult' 
                  ? 'Exclusive adult content & features' 
                  : 'Unlock all premium features'}
              </p>
            </div>
            
            <div className="premium-plan-body">
              {/* 18+ Features Section - Only for adult plan */}
              {plan.id === 'vip_adult' && (
                <div className="adult-features-section">
                  <div className="adult-features-header">
                    <span className="adult-icon">🔞</span>
                    <span>18+ Exclusive Features</span>
                  </div>
                  <ul className="premium-plan-features adult-features">
                    {adultFeatures.map((feature, index) => (
                      <li key={index}>
                        <span className="feature-icon">{feature.icon}</span>
                        <span className="feature-text">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Regular Features */}
              <ul className="premium-plan-features">
                {plan.id === 'vip_adult' ? (
                  <>
                    <li className="vip-includes">
                      <span className="premium-check">✨</span>
                      <span>All VIP Features Included</span>
                    </li>
                    {vipFeatures.slice(0, 3).map((feature, index) => (
                      <li key={`vip-${index}`}>
                        <span className="premium-check">{feature.icon}</span>
                        {feature.text}
                      </li>
                    ))}
                  </>
                ) : (
                  plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="premium-check">✦</span>
                      {feature}
                    </li>
                  ))
                )}
              </ul>
              
              <div className="premium-plan-action">
                {renderButton(plan)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="premium-info-card">
        <div className="premium-info-header">
          <span className="premium-info-icon">💎</span>
          <h4>How to Activate VIP</h4>
        </div>
        <ol className="premium-info-steps">
          <li><span className="step-num">1</span> Select your preferred plan above</li>
          <li><span className="step-num">2</span> You'll be redirected to Telegram</li>
          <li><span className="step-num">3</span> Contact our team and complete payment</li>
          <li><span className="step-num">4</span> VIP activated instantly!</li>
        </ol>
      </div>
    </div>
  );
}

export default Membership;
