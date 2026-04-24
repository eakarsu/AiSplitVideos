import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Video, Check } from 'lucide-react';
import { API_URL } from '../utils/api';

const PasswordResetPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [valid, setValid] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axios.get(`${API_URL}/password-reset/verify/${token}`);
        setValid(true);
      } catch {
        setValid(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/password-reset/reset`, { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
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
        {valid === false && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: 16 }}>This reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Request New Link</Link>
          </div>
        )}
        {valid === true && !success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        {success && (
          <div style={{ textAlign: 'center' }}>
            <Check size={48} color="#16a34a" style={{ marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>Password Reset!</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Your password has been reset successfully.</p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetPage;
