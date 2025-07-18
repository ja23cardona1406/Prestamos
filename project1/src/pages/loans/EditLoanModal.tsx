import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import type { Loan, Equipment } from '../../types';
import { uploadFI1557Evidence } from '../../lib/supabase';

interface EditLoanModalProps {
  loan: Loan;
  onClose: () => void;
  onSave: (loanData: Partial<Loan>) => Promise<void>;
  availableEquipment: Equipment[];
}

function EditLoanModal({ loan, onClose, onSave, availableEquipment }: EditLoanModalProps) {
  const [formData, setFormData] = useState({
    borrower_name: loan.borrower_name,
    borrower_department: loan.borrower_department,
    equipment_id: loan.equipment_id,
    start_date: format(new Date(loan.start_date + 'T12:00:00'), 'yyyy-MM-dd'),
    expected_return_date: format(new Date(loan.expected_return_date + 'T12:00:00'), 'yyyy-MM-dd'),
    accessories: [...loan.accessories],
    notes: loan.notes || '',
    status: loan.status,
    fi_1557_filled: loan.fi_1557_filled,
    fi_1557_evidence: null as File | null
  });

  const [accessory, setAccessory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    loan.fi_1557_evidence?.[0]?.url || null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { fi_1557_evidence, ...restFormData } = formData;
    
    try {
      if (fi_1557_evidence) {
        const evidence = await uploadFI1557Evidence(loan.id, fi_1557_evidence);
        await onSave({
          ...restFormData,
          fi_1557_evidence: [evidence]
        });
      } else {
        await onSave({
          ...restFormData,
          fi_1557_evidence: loan.fi_1557_evidence
        });
      }
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, fi_1557_evidence: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAccessory = () => {
    if (accessory.trim()) {
      setFormData(prev => ({
        ...prev,
        accessories: [...prev.accessories, accessory.trim()]
      }));
      setAccessory('');
    }
  };

  const removeAccessory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Préstamo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Funcionario</label>
              <input
                type="text"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                value={formData.borrower_name}
                onChange={e => setFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <input
                type="text"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                value={formData.borrower_department}
                onChange={e => setFormData(prev => ({ ...prev, borrower_department: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
            <select
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.equipment_id}
              onChange={e => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
            >
              <option value={loan.equipment_id}>
                {loan.equipment?.model} ({loan.equipment?.type}) - Actual
              </option>
              {availableEquipment
                .filter(eq => eq.id !== loan.equipment_id)
                .map(equipment => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.model} ({equipment.type})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Préstamo</label>
              <input
                type="date"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución</label>
              <input
                type="date"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                value={formData.expected_return_date}
                onChange={e => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Loan['status'] }))}
            >
              <option value="active">Activo</option>
              <option value="returned">Devuelto</option>
              <option value="delayed">Retrasado</option>
              <option value="lost">Extraviado</option>
              <option value="damaged">Dañado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Se diligenció el formato FI-1557?</label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
                  checked={formData.fi_1557_filled}
                  onChange={e => setFormData(prev => ({ ...prev, fi_1557_filled: e.target.checked }))}
                />
                <span className="ml-2">Sí, el formato está diligenciado</span>
              </label>
            </div>
          </div>

          {formData.fi_1557_filled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia del formato FI-1557</label>
              
              {loan.fi_1557_evidence && loan.fi_1557_evidence.length > 0 && !formData.fi_1557_evidence && (
                <div className="mt-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Evidencia actual:</p>
                  <img
                    src={loan.fi_1557_evidence[0].url}
                    alt="Evidencia actual"
                    className="max-h-48 rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                      <span>Cargar nuevo archivo</span>
                      <input
                        id="file-upload-edit"
                        name="file-upload-edit"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                </div>
              </div>

              {formData.fi_1557_evidence && previewUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Nueva evidencia:</p>
                  <img
                    src={previewUrl}
                    alt="Nueva evidencia"
                    className="max-h-48 rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                value={accessory}
                onChange={e => setAccessory(e.target.value)}
                placeholder="Agregar accesorio"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
              />
              <button
                type="button"
                onClick={addAccessory}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.accessories.map((acc, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {acc}
                  <button
                    type="button"
                    onClick={() => removeAccessory(index)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales..."
            />
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLoanModal;