import React from 'react';
import { SubscriptionActivationManager } from '../SubscriptionActivationManager';

interface Props {
  onUpdate?: () => void;
}

export const AdminSubscriptionManagement: React.FC<Props> = ({ onUpdate }) => {
  return <SubscriptionActivationManager />;
};

export default AdminSubscriptionManagement;
