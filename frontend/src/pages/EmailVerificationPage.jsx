import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Video, Check, X } from 'lucide-react';
import { API_URL } from '../utils/api';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`${API_URL}/email-verification/verify/${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-logo">
          <Video size={48} color="#6366f1" />
        </div>
        {status === 'verifying' && <p>Verifying your email...</p>}
        {status === 'success' && (
          <>
            <Check size={48} color="#16a34a" style={{ marginBottom: 16 }} />
            <h2>Email Verified!</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Your email has been verified successfully.</p>
            <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Dashboard</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <X size={48} color="#dc2626" style={{ marginBottom: 16 }} />
            <h2>Verification Failed</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>This verification link is invalid or has expired.</p>
            <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
