import React from 'react';
import type { Equipment } from '../../types';

interface EquipmentStatusProps {
  status: Equipment['status'];
}

function EquipmentStatus({ status }: EquipmentStatusProps) {
  const statusConfig = {
    available: {
      className: 'bg-green-100 text-green-800',
      text: 'Disponible'
    },
    loaned: {
      className: 'bg-yellow-100 text-yellow-800',
      text: 'En préstamo'
    },
    maintenance: {
      className: 'bg-blue-100 text-blue-800',
      text: 'En mantenimiento'
    },
    lost: {
      className: 'bg-red-100 text-red-800',
      text: 'Extraviado'
    },
    damaged: {
      className: 'bg-red-100 text-red-800',
      text: 'Dañado'
    },
    inactive: {
      className: 'bg-purple-100 text-purple-800',
      text: 'Inactivo'
    },
    unavailable: {
      className: 'bg-gray-100 text-gray-800',
      text: 'No disponible'
    },
    in_use: {
      className: 'bg-orange-100 text-orange-800',
      text: 'En uso'
    },
    retired: {
      className: 'bg-gray-100 text-gray-800',
      text: 'Retirado'
    }
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.text}
    </span>
  );
}

export default EquipmentStatus;