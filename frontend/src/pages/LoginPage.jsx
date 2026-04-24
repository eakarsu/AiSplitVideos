import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/demo-credentials`);
      setEmail(res.data.email);
      setPassword(res.data.password);
    } catch {
      setEmail('demo@aisplitvideo.com');
      setPassword('demo123456');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Video size={48} color="#6366f1" />
          <h1>AI Split Videos</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <button type="button" className="btn btn-fill-demo" onClick={handleFillDemo}>
            <Settings size={18} />
            Fill Demo Credentials
          </button>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/forgot-password" style={{ color: '#6366f1', textDecoration: 'none' }}>Forgot Password?</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
