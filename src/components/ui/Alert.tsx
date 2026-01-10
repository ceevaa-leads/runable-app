import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export const Alert: React.FC<AlertProps> = ({ type, message, className }) => {
  const Icon = icons[type];

  return (
    <div className={clsx('alert', `alert-${type}`, className)}>
      <Icon className="alert-icon" />
      <span className="alert-message">{message}</span>
    </div>
  );
};

