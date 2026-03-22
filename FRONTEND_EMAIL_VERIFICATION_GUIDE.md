# Frontend Email Verification Implementation Guide

## 🔍 How to Check Email Verification Status

### 1. **From Login Response**

When user logs in, the response includes `emailVerified` status:

```javascript
// POST /en/auth/signin
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "emailVerified": false,  // ← Check this field
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields
  }
}
```

### 2. **From Current User Endpoint**

Get current user info (with auth token):

```javascript
// GET /en/users/me
// Headers: { Authorization: 'Bearer YOUR_TOKEN' }
{
  "_id": "user_id",
  "email": "user@example.com",
  "emailVerified": false,  // ← Check this field
  // ... other user fields
}
```

## 📱 Frontend Implementation Strategies

### Strategy 1: **Global Auth Context (React Example)**

```jsx
// AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('/en/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        // Check if email is verified
        if (!data.user.emailVerified) {
          // Show verification banner/modal
          showEmailVerificationBanner();
        }
        
        return { success: true, emailVerified: data.user.emailVerified };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Check email verification status
  const checkEmailVerification = () => {
    return user?.emailVerified || false;
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      const response = await fetch('/en/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return response.ok;
    } catch (error) {
      console.error('Failed to resend verification:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      checkEmailVerification,
      resendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Strategy 2: **Email Verification Banner Component**

```jsx
// EmailVerificationBanner.jsx
import { useState } from 'react';
import { useAuth } from './AuthContext';

function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Don't show if email is verified or no user
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    const success = await resendVerificationEmail();
    
    if (success) {
      setMessage('Verification email sent! Check your inbox.');
    } else {
      setMessage('Failed to send. Please try again.');
    }
    
    setSending(false);
    
    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="email-verification-banner">
      <div className="banner-content">
        <span className="warning-icon">⚠️</span>
        <div className="banner-text">
          <strong>Email verification required</strong>
          <p>Please verify your email address to access all features.</p>
        </div>
        <button 
          onClick={handleResend} 
          disabled={sending}
          className="resend-button"
        >
          {sending ? 'Sending...' : 'Resend Email'}
        </button>
      </div>
      {message && <div className="message">{message}</div>}
    </div>
  );
}

// CSS
.email-verification-banner {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  padding: 15px;
  margin: 10px;
  border-radius: 5px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.warning-icon {
  font-size: 24px;
}

.resend-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.resend-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Strategy 3: **Protected Route Wrapper**

```jsx
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute({ 
  children, 
  requireEmailVerification = false,
  fallback = '/dashboard' 
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check email verification if required
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <div className="verification-required">
        <h2>Email Verification Required</h2>
        <p>This feature requires a verified email address.</p>
        <EmailVerificationBanner />
        <button onClick={() => window.location.href = fallback}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
}

// Usage
<ProtectedRoute requireEmailVerification={true}>
  <PremiumFeaturePage />
</ProtectedRoute>
```

### Strategy 4: **API Interceptor for 403 Errors**

```javascript
// apiInterceptor.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle email verification errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      const data = error.response.data;
      
      // Check if it's email verification error
      if (data.code === 'EMAIL_NOT_VERIFIED') {
        // Show global notification
        showNotification({
          type: 'warning',
          title: 'Email Verification Required',
          message: 'Please verify your email to continue',
          action: {
            label: 'Resend Email',
            handler: () => resendVerificationEmail()
          }
        });
        
        // Optionally redirect to verification page
        // window.location.href = '/verify-email-required';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## 🎯 **Complete Frontend Flow**

### 1. **Login Page**
```jsx
function LoginPage() {
  const { login } = useAuth();
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    
    if (result.success) {
      if (!result.emailVerified) {
        setShowVerificationNotice(true);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div>
      {showVerificationNotice && (
        <Alert type="info">
          Please check your email to verify your account.
          <button onClick={resendVerification}>Resend Email</button>
        </Alert>
      )}
      {/* Login form */}
    </div>
  );
}
```

### 2. **Dashboard/Main App**
```jsx
function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* Always show banner if email not verified */}
      <EmailVerificationBanner />
      
      {/* Main content */}
      <div className="dashboard-content">
        {/* Some features disabled if not verified */}
        {user.emailVerified ? (
          <PremiumFeatures />
        ) : (
          <div className="locked-features">
            <Lock />
            <p>Verify your email to unlock all features</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. **Feature Access Control**
```jsx
function FeatureButton({ feature, onClick }) {
  const { user } = useAuth();
  
  const handleClick = () => {
    if (!user.emailVerified && feature.requiresVerification) {
      showModal({
        title: 'Email Verification Required',
        content: 'Please verify your email to use this feature.',
        actions: [
          { label: 'Resend Email', handler: resendVerification },
          { label: 'Cancel', handler: closeModal }
        ]
      });
      return;
    }
    
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={!user.emailVerified && feature.requiresVerification ? 'locked' : ''}
    >
      {feature.name}
      {!user.emailVerified && feature.requiresVerification && <LockIcon />}
    </button>
  );
}
```

## 🔒 **Backend Enforcement**

For critical features, also enforce on backend:

```typescript
// Example: In your controller
@Post('create-invoice')
@UseGuards(AuthGuard(), EmailVerifiedGuard)
@RequireEmailVerification()  // Custom decorator
async createInvoice(@Body() data: CreateInvoiceDto) {
  // Only verified users can create invoices
}
```

## 📊 **Verification Status Indicators**

### Visual Indicators
```jsx
function UserProfile() {
  const { user } = useAuth();
  
  return (
    <div className="profile">
      <div className="email-section">
        <span>{user.email}</span>
        {user.emailVerified ? (
          <span className="verified-badge">✓ Verified</span>
        ) : (
          <span className="unverified-badge">⚠️ Unverified</span>
        )}
      </div>
    </div>
  );
}
```

### CSS Styles
```css
.verified-badge {
  color: #28a745;
  font-size: 14px;
  margin-left: 8px;
}

.unverified-badge {
  color: #ffc107;
  font-size: 14px;
  margin-left: 8px;
  cursor: pointer;
}

.locked-features {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.locked-features::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
}
```

## 🎯 **Best Practices**

1. **Always check `emailVerified` from login response**
2. **Show persistent banner until verified**
3. **Disable critical features for unverified users**
4. **Provide easy "Resend Email" option**
5. **Handle 403 errors globally for API calls**
6. **Show clear messaging about why verification is needed**
7. **Consider allowing basic features while unverified**

## 🔄 **State Management (Redux Example)**

```javascript
// authSlice.js
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isEmailVerified: false,
    verificationEmailSent: false
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isEmailVerified = action.payload.user.emailVerified;
    },
    emailVerified: (state) => {
      state.isEmailVerified = true;
      if (state.user) {
        state.user.emailVerified = true;
      }
    },
    verificationEmailSent: (state) => {
      state.verificationEmailSent = true;
    }
  }
});

// Selector
export const selectIsEmailVerified = (state) => 
  state.auth.isEmailVerified;

// Usage in component
const isEmailVerified = useSelector(selectIsEmailVerified);
```

This comprehensive approach ensures users are properly guided to verify their email while maintaining a good user experience!