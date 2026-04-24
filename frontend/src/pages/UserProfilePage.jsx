import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Key, Trash2, Download } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { LoadingSpinner, LoadingButton } from '../components/common';
import { formatDate } from '../utils/formatters';

const UserProfilePage = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/account/profile`);
      setProfile(res.data);
      setName(res.data.name || '');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/account/profile`, { name });
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setChangingPassword(true);
    try {
      await axios.put(`${API_URL}/account/change-password`, { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm('Delete Account', 'Are you sure you want to permanently delete your account? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await axios.delete(`${API_URL}/account/account`);
      toast.success('Account deleted');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await axios.get(`${API_URL}/account/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'my-data-export.json'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name}`} alt={profile?.name} />
          </div>
          <h2>{profile?.name}</h2>
          <p style={{ color: '#64748b' }}>{profile?.email}</p>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Joined {formatDate(profile?.created_at)}</p>
          {profile?.roles && (
            <div className="profile-roles">
              {profile.roles.map(r => <span key={r.id} className="tag">{r.name}</span>)}
            </div>
          )}
        </div>

        <div className="profile-sections">
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} /> Edit Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={profile?.email || ''} disabled />
              </div>
              <LoadingButton loading={saving} type="submit">Save Changes</LoadingButton>
            </form>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Key size={20} /> Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <LoadingButton loading={changingPassword} type="submit">Change Password</LoadingButton>
            </form>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Download size={20} /> Export Data</h3>
            <p style={{ color: '#64748b', marginBottom: 12 }}>Download all your data as a JSON file.</p>
            <button className="btn btn-secondary" onClick={handleExportData}><Download size={16} /> Export My Data</button>
          </div>

          <div className="card" style={{ padding: 24, border: '1px solid #fecaca' }}>
            <h3 style={{ marginBottom: 16, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={20} /> Danger Zone</h3>
            <p style={{ color: '#64748b', marginBottom: 12 }}>Permanently delete your account and all associated data.</p>
            <button className="btn btn-danger" onClick={handleDeleteAccount}><Trash2 size={16} /> Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
