import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Video, Mail } from 'lucide-react';
import { API_URL } from '../utils/api';

const PasswordResetRequestPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/password-reset/request`, { email });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Video size={48} color="#6366f1" />
          <h1>Reset Password</h1>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <Mail size={48} color="#6366f1" style={{ marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>Check Your Email</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>If an account exists with that email, we've sent password reset instructions.</p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#64748b', marginBottom: 20 }}>Enter your email and we'll send you a link to reset your password.</p>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" style={{ color: '#6366f1' }}>Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordResetRequestPage;
