import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../layout';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
