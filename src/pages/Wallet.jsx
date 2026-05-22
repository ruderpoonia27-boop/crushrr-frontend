import React, { useState, useEffect } from 'react';
import { coinsAPI } from '../api';
import { Navigate } from 'react-router-dom';

function Wallet({ user, onProfileUpdate, showToast, onUserUpdate }) {
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [showUpiForm, setShowUpiForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  const isVIP = user?.membership === 'vip' || user?.membership === 'vip_adult';
  const isAdult = user?.membership === 'vip_adult';

  // Refresh user data when component mounts
  useEffect(() => {
    if (onUserUpdate) {
      onUserUpdate();
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await coinsAPI.getAdminSettings();
      setSettings(data || {});
    } catch (err) {
      console.log('Using default settings');
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

  const handleDeposit = () => {
    const telegramLink = settings.depositTelegram || 'crusherr_deposit';
    openTelegramLink(telegramLink);
  };

  const handleWithdraw = () => {
    const telegramLink = settings.withdrawTelegram || 'crusherr_withdraw';
    openTelegramLink(telegramLink);
  };

  const handleBuyVIP = () => {
    const telegramLink = settings.vipTelegram || 'crusherr_vip';
    openTelegramLink(telegramLink);
  };

  const handleBuyAdult = () => {
    const telegramLink = settings.adultTelegram || 'crusherr_adult';
    openTelegramLink(telegramLink);
  };

  const handleSupport = () => {
    const telegramLink = settings.supportTelegram || 'crusherr_support';
    openTelegramLink(telegramLink);
  };

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    if (!upiId.trim()) {
      showToast('Please enter a valid UPI ID', 'error');
      return;
    }

    setSaving(true);
    try {
      await coinsAPI.updateUPI(upiId.trim());
      onProfileUpdate({ ...user, upiId: upiId.trim() });
      setShowUpiForm(false);
      showToast('UPI ID saved successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="wallet-page">
      {/* Premium Wallet Card */}
      <div className="premium-wallet-card">
        <div className="premium-wallet-glow"></div>
        <div className="premium-wallet-content">
          <div className="premium-wallet-icon">
            <span className="coin-float">💖</span>
          </div>
          <h2 className="premium-wallet-title">Love Coins Wallet</h2>
          <div className="premium-wallet-balance">
            <span className="balance-number">{user.loveCoins || 0}</span>
            <span className="balance-icon">💰</span>
          </div>
          <p className="premium-wallet-label">Available Coins</p>
          
          <div className="premium-wallet-divider"></div>
          
          {!isVIP && (
            <div className="vip-lock-overlay">
              <div className="vip-lock-icon">🔒</div>
              <p className="vip-lock-text">VIP Required</p>
              <p className="vip-lock-subtext">Upgrade to VIP to use your coins</p>
            </div>
          )}
        </div>
      </div>

      {/* VIP Badge */}
      {isVIP ? (
        <div className="vip-badge-display">
          <span className="vip-badge-icon">👑</span>
          <span>VIP Member</span>
        </div>
      ) : (
        <div className="upgrade-banner" onClick={handleBuyVIP}>
          <div className="upgrade-banner-content">
            <span className="upgrade-banner-icon">👑</span>
            <div className="upgrade-banner-text">
              <strong>Upgrade to VIP</strong>
              <span>Unlock wallet features & more</span>
            </div>
            <span className="upgrade-banner-arrow">→</span>
          </div>
        </div>
      )}

      {/* 18+ Access Banner (if VIP but not adult) */}
      {isVIP && !isAdult && (
        <div className="upgrade-banner adult-banner" onClick={handleBuyAdult} style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #8b0000 0%, #4a148c 100%)' }}>
          <div className="upgrade-banner-content">
            <span className="upgrade-banner-icon">🔞</span>
            <div className="upgrade-banner-text">
              <strong>Get 18+ Access</strong>
              <span>Unlock adult content</span>
            </div>
            <span className="upgrade-banner-arrow">→</span>
          </div>
        </div>
      )}

      {/* Wallet Buttons */}
      <div className="wallet-buttons">
        <button 
          id="deposit-btn"
          className={`wallet-btn ${!isVIP ? 'wallet-btn-locked' : 'wallet-btn-deposit'}`}
          onClick={handleDeposit}
          type="button"
          disabled={!isVIP}
        >
          <span className="btn-icon">💰</span>
          <span className="btn-text">{!isVIP ? '🔒 Deposit' : 'Deposit'}</span>
        </button>
        <button 
          id="withdraw-btn"
          className={`wallet-btn ${!isVIP ? 'wallet-btn-locked' : 'wallet-btn-withdraw'}`}
          onClick={handleWithdraw}
          type="button"
          disabled={!isVIP}
        >
          <span className="btn-icon">💸</span>
          <span className="btn-text">{!isVIP ? '🔒 Withdraw' : 'Withdraw'}</span>
        </button>
      </div>

      {/* UPI ID Section */}
      <div className={`upi-section ${!isVIP ? 'upi-section-locked' : ''}`}>
        {!isVIP ? (
          <div className="upi-locked-message">
            <span className="upi-locked-icon">🔒</span>
            <p>UPI ID setup is available for VIP members only</p>
            <button className="btn-upgrade-small" onClick={handleBuyVIP}>
              👑 Upgrade to VIP
            </button>
          </div>
        ) : (
          <>
            {user.upiId && !showUpiForm ? (
              <div className="upi-display">
                <h3 className="upi-title">Your UPI ID</h3>
                <p className="upi-value">{user.upiId}</p>
                <button 
                  className="upi-edit-btn"
                  onClick={() => setShowUpiForm(true)}
                  type="button"
                >
                  ✏️ Edit UPI
                </button>
              </div>
            ) : (
              <div className="upi-form-container">
                <h3 className="upi-title">Add Your UPI ID</h3>
                <form onSubmit={handleSaveUpi} className="upi-form">
                  <input
                    type="text"
                    className="upi-input"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="upi-save-btn"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : '💾 Save UPI'}
                  </button>
                </form>
                {user.upiId && (
                  <button 
                    className="upi-cancel-btn"
                    onClick={() => {
                      setShowUpiForm(false);
                      setUpiId(user.upiId);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Support Button */}
      <div className="support-section">
        <button id="support-btn" className="support-btn" onClick={handleSupport}>
          🎧 Need Help? Contact Support
        </button>
      </div>

      {/* Features Preview */}
      {!isVIP && (
        <div className="vip-features-preview">
          <h3>👑 VIP Benefits</h3>
          <ul>
            <li>💰 Deposit & Withdraw Coins</li>
            <li>💖 Unlock Premium Profiles</li>
            <li>✨ Unlimited Likes & Matches</li>
            <li>⭐ Verified VIP Badge</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Wallet;
