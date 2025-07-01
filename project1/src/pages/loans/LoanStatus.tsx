import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { Loan } from '../../types';

interface LoanStatusProps {
  status: Loan['status'];
}

function LoanStatus({ status }: LoanStatusProps) {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      text: 'Activo',
      className: 'bg-green-100 text-green-800'
    },
    returned: {
      icon: CheckCircle,
      text: 'Devuelto',
      className: 'bg-gray-100 text-gray-800'
    },
    delayed: {
      icon: AlertCircle,
      text: 'Retrasado',
      className: 'bg-red-100 text-red-800'
    },
    lost: {
      icon: XCircle,
      text: 'Extraviado',
      className: 'bg-red-100 text-red-800'
    },
    damaged: {
      icon: AlertCircle,
      text: 'Dañado',
      className: 'bg-yellow-100 text-yellow-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-4 w-4 mr-1" />
      {config.text}
    </span>
  );
}

export default LoanStatus;