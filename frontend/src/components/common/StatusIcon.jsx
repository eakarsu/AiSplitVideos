import React from 'react';
import { CheckCircle, Zap, Clock, AlertCircle } from 'lucide-react';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'completed':
    case 'processed':
    case 'active':
    case 'generated':
      return <CheckCircle size={16} className="status-icon status-success" />;
    case 'processing':
      return <Zap size={16} className="status-icon" style={{ color: '#6366f1' }} />;
    case 'pending':
      return <Clock size={16} className="status-icon status-pending" />;
    case 'failed':
      return <AlertCircle size={16} className="status-icon status-failed" />;
    default:
      return null;
  }
};

export default StatusIcon;
