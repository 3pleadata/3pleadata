import React from 'react';
import { ScheduledPayments } from '../components/ScheduledPayments';
import { AppState } from '../services/storage';
import { Transaction } from '../types';

interface ScheduledPaymentsPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
  onViewReceipt?: (tx: Transaction) => void;
  onOpenFundModal?: () => void;
}

export const ScheduledPaymentsPage: React.FC<ScheduledPaymentsPageProps> = ({
  state,
  updateState,
  language,
  onViewReceipt,
  onOpenFundModal,
}) => {
  return (
    <ScheduledPayments
      state={state}
      updateState={updateState}
      language={language}
      onViewReceipt={onViewReceipt}
      onOpenFundModal={onOpenFundModal}
    />
  );
};
