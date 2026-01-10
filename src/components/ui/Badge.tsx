import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

// Helper to get badge variant from lead status
export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'CONTACTED':
      return 'warning';
    case 'IN_PROGRESS':
      return 'default';
    case 'CONVERTED':
      return 'success';
    case 'LOST':
      return 'danger';
    case 'DORMANT':
      return 'secondary';
    default:
      return 'default';
  }
};

// Helper to get readable status label
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'CONTACTED':
      return 'Contacted';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'CONVERTED':
      return 'Converted';
    case 'LOST':
      return 'Lost';
    case 'DORMANT':
      return 'Dormant';
    default:
      return status;
  }
};

