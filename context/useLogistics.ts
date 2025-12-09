import { useContext } from 'react';
import { LogisticsContext } from './LogisticsContext';

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
