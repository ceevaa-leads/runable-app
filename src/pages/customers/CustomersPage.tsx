import React from 'react';
import { HeartHandshake } from 'lucide-react';
import { ComingSoonPage } from '../common/ComingSoonPage';

export const CustomersPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Customers"
      description="Manage your converted leads and customer relationships. Track interactions, view purchase history, and nurture long-term partnerships."
      icon={<HeartHandshake size={48} />}
    />
  );
};


