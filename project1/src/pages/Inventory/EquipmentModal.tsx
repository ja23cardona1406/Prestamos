import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Equipment, EquipmentType, EquipmentStatus } from '../../types';

interface EquipmentModalProps {
  onClose: () => void;
  onSubmit: (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  equipment?: Equipment | null;
}

function EquipmentModal({ onClose, onSubmit, equipment }: EquipmentModalProps) {
  const [formData, setFormData] = useState({
    type: (equipment?.type || 'laptop') as EquipmentType,
    model: equipment?.model || '',
    serial_number: equipment?.serial_number || '',
    status: (equipment?.status || 'available') as EquipmentStatus,
    imagenes: equipment?.imagenes || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.type}
              onChange={e => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as EquipmentType
              }))}
              disabled={!!equipment}
            >
              <option value="laptop">Laptop</option>
              <option value="printer">Impresora</option>
              <option value="desktop">Computador de mesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo con No Serial</label>
            <input
              type="text"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input
              type="text"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.serial_number}
              onChange={e => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as EquipmentStatus }))}
            >
              <option value="available">Disponible</option>
              <option value="maintenance">En mantenimiento</option>
              <option value="lost">Extraviado</option>
              <option value="damaged">Dañado</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {equipment ? 'Guardar Cambios' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EquipmentModal;