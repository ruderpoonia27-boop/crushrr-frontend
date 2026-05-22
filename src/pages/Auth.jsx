import React, { useState } from 'react';
import { authAPI } from '../api';
import { auth, googleProvider, signInWithPopup } from '../firebase';

const TERMS_AND_CONDITIONS = `1. Acceptance of Terms
By accessing and using Crusherr ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this Platform.

2. Age Requirement
The Platform is strictly for users who are 18 years of age or older. By using this Platform, you confirm that you are at least 18 years old. Any registration or use of the Platform by anyone under 18 is prohibited.

3. User Responsibility & Risk
You understand and acknowledge that:
- You are using this platform entirely at your own risk
- Any payment which user do for more facility he do on his own risk
- The Platform facilitates connections but does not verify the identity or intentions of users
- All interactions, meetings, and communications outside the Platform are at your sole discretion and risk
- You should exercise caution and use best judgment when interacting with other users

4. No Liability for Offline Actions
Crusherr is not responsible for:
- Any scams, fraud, or deceptive practices by users
- Any physical harm, emotional distress, or financial loss resulting from offline meetings
- Any disputes between users, whether online or offline
- The accuracy of information provided by users

5. Third-Party Services
The Platform uses Telegram as the primary communication channel. Crusherr is not affiliated with, endorsed by, or responsible for Telegram's services, privacy practices, or terms of service. Users must comply with Telegram's terms when using the messaging service.

6. No Explicit Content
The Platform does not host, display, or distribute explicit adult content. Any attempt to post or share such content will result in immediate account termination and IP blocking.

7. Data Usage & Privacy
Your personal data is used solely for:
- Account verification and security
- Platform functionality improvement
- Communication with users
We do not sell, trade, or share your personal data with third parties for marketing purposes.

8. Account Termination
Crusherr reserves the right to terminate or suspend any account at any time for any reason, including but not limited to violation of these terms, inappropriate behavior, or suspected fraudulent activity.

9. Modifications to Terms
Crusherr reserves the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified terms.

10. Contact Information
If you have any questions about these Terms & Conditions, please contact us through the Platform.`;

const PRIVACY_POLICY = `1. Introduction
At Crusherr, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.

2. Information We Collect
We collect the following types of information:
- Personal Information: Name, email, date of birth, profile picture, bio, interests, and Telegram contact information
- Usage Data: Information about how you use the Platform
- Device Information: IP address, browser type, and device identifiers

3. How We Use Your Information
Your information is used for:
- Creating and managing your account
- Providing customer support
- Verifying your identity and age (18+)
- Connecting you with other users
- Improving our services
- Communicating important updates

4. Data Protection & Security
We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.

5. Data Sharing & Disclosure
We do NOT:
- Sell your personal data to third parties
- Share your data for advertising purposes
- Disclose your information except as required by law

We may share data with:
- Service providers who assist in Platform operations
- Law enforcement when legally required

6. Third-Party Services
The Platform uses Telegram for messaging. Your Telegram username or phone number is shared with other users when you choose to connect with them. Please review Telegram's Privacy Policy for information about how they handle your data.

7. User Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of data collection
- Export your data

8. Data Retention
We retain your personal data for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.

9. Children's Privacy
The Platform is not intended for users under 18. We do not knowingly collect personal information from anyone under 18. If we become aware of such collection, we will immediately delete the data.

10. Changes to Policy
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.

11. Contact Us
If you have any questions about this Privacy Policy, please contact us through the Platform.`;

function Auth({ onLogin, showToast }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const EyeIcon = ({ hidden }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {hidden ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.4 9.5 7a12.6 12.6 0 0 1-2.1 3.3" />
          <path d="M6.2 6.8A12.9 12.9 0 0 0 2.5 12c1 2.6 4.5 7 9.5 7a10.8 10.8 0 0 0 4.1-.8" />
        </>
      ) : (
        <>
          <path d="M2.5 12c1-2.6 4.5-7 9.5-7s8.5 4.4 9.5 7c-1 2.6-4.5 7-9.5 7s-8.5-4.4-9.5-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const ensureFirebaseAuthorizedLocalHost = () => {
    if (window.location.hostname === '127.0.0.1') {
      const nextUrl = new URL(window.location.href);
      nextUrl.hostname = 'localhost';
      window.location.replace(nextUrl.toString());
      return false;
    }

    return true;
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!agreed) {
      showToast('Please agree to the terms', 'error');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authAPI.login({
        email: loginEmail,
        password: loginPassword
      });
      onLogin(user, token);
      showToast('Welcome back!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerName || !registerEmail || !registerPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    if (registerPassword !== registerConfirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    if (registerPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    if (!agreed) {
      showToast('Please agree to the terms', 'error');
      return;
    }

    if (!ensureFirebaseAuthorizedLocalHost()) {
      showToast('Opening Google login on localhost...', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const { token, user } = await authAPI.register({
        name: registerName,
        email: registerEmail,
        password: registerPassword
      });
      onLogin(user, token);
      showToast('Account created! Complete your profile', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (!agreed) {
      showToast('Please agree to the terms', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send the ID token to the backend
      const { token, user } = await authAPI.googleLogin(idToken);
      onLogin(user, token);
      showToast('Welcome back!', 'success');
    } catch (err) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Login cancelled', 'error');
      } else if (err.code === 'auth/unauthorized-domain') {
        showToast('Firebase domain not authorized. Use http://localhost:5173 or add this domain in Firebase Auth settings.', 'error');
      } else {
        showToast(err.message || 'Google login failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleRegister = async () => {
    if (!agreed) {
      showToast('Please agree to the terms', 'error');
      return;
    }

    if (!ensureFirebaseAuthorizedLocalHost()) {
      showToast('Opening Google register on localhost...', 'info');
      return;
    }
    
    setLoading(true);
    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send the ID token to the backend for registration
      const { token, user } = await authAPI.googleRegister(idToken);
      onLogin(user, token);
      showToast('Account created with Google!', 'success');
    } catch (err) {
      console.error('Google register error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Login cancelled', 'error');
      } else if (err.code === 'auth/unauthorized-domain') {
        showToast('Firebase domain not authorized. Use http://localhost:5173 or add this domain in Firebase Auth settings.', 'error');
      } else {
        showToast(err.message || 'Google registration failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">💕 Crushrr</h1>
            <p>Premium Dating Experience</p>
          </div>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          
          <div className="auth-form">
            {activeTab === 'login' && (
              <form onSubmit={handleLogin}>
                {/* Google Sign In - Now at TOP */}
                <div className="google-section">
                  <button 
                    type="button" 
                    className="btn btn-google-premium btn-block"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
                
                <div className="divider">
                  <span>or sign in with email</span>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowLoginPassword(prev => !prev)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon hidden={showLoginPassword} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span>
                      I agree to the 
                      <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); setShowTerms(true); }}> Terms & Conditions</button>
                      and
                      <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }}> Privacy Policy</button>
                    </span>
                  </label>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-signin"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Sign In'}
                </button>
              </form>
            )}
            
            {activeTab === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon">ðŸ”’</span>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowRegisterPassword(prev => !prev)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon hidden={showRegisterPassword} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon">ðŸ”’</span>
                    <input
                      type={showRegisterConfirm ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Confirm your password"
                      value={registerConfirm}
                      onChange={(e) => setRegisterConfirm(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowRegisterConfirm(prev => !prev)}
                      aria-label={showRegisterConfirm ? 'Hide password' : 'Show password'}
                      title={showRegisterConfirm ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon hidden={showRegisterConfirm} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span>
                      I agree to the 
                      <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); setShowTerms(true); }}> Terms & Conditions</button>
                      and
                      <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }}> Privacy Policy</button>
                    </span>
                  </label>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Register'}
                </button>
                
                <div className="divider">
                  <span>OR</span>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-google btn-block"
                  onClick={handleGoogleRegister}
                  disabled={loading}
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
                  Sign up with Google
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="premium-modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="premium-modal-icon">📜</div>
              <h2>Terms & Conditions</h2>
              <button className="premium-modal-close" onClick={() => setShowTerms(false)}>×</button>
            </div>
            <div className="premium-modal-body">
              <pre>{TERMS_AND_CONDITIONS}</pre>
            </div>
            <div className="premium-modal-footer">
              <button className="btn btn-premium" onClick={() => setShowTerms(false)}>
                I Understand ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="premium-modal-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header privacy">
              <div className="premium-modal-icon">🔒</div>
              <h2>Privacy Policy</h2>
              <button className="premium-modal-close" onClick={() => setShowPrivacy(false)}>×</button>
            </div>
            <div className="premium-modal-body">
              <pre>{PRIVACY_POLICY}</pre>
            </div>
            <div className="premium-modal-footer">
              <button className="btn btn-premium" onClick={() => setShowPrivacy(false)}>
                I Understand ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;
