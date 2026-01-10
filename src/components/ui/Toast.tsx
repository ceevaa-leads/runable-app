import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, Building2, Mail } from 'lucide-react';
import clsx from 'clsx';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  details?: {
    businessName?: string;
    email?: string;
    isNewBusiness?: boolean;
    isNewLead?: boolean;
  };
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const dismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={clsx('toast', `toast-${toast.type}`, { 'toast-exiting': isExiting })}>
      <div className="toast-icon">
        {icons[toast.type]}
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
        {toast.details && (
          <div className="toast-details">
            {toast.details.businessName && (
              <div className="toast-detail-item">
                <Building2 size={14} />
                <span>{toast.details.businessName}</span>
                {toast.details.isNewBusiness && <span className="toast-badge">New</span>}
              </div>
            )}
            {toast.details.email && (
              <div className="toast-detail-item">
                <Mail size={14} />
                <span>{toast.details.email}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <button className="toast-dismiss" onClick={handleDismiss}>
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, dismissToast };
};

