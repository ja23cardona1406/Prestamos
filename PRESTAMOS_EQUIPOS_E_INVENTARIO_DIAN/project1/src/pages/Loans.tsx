import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Calendar, AlertCircle, CheckCircle, XCircle, X, Edit2, Image, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { Loan, Equipment, FileEvidence } from '../types';
import { fetchLoans, updateLoanStatus, createLoan, fetchEquipment, updateLoan, uploadFI1557Evidence } from '../lib/supabase';

function LoanStatus({ status }: { status: Loan['status'] }) {
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

function Loans() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    loadLoans();
    loadAvailableEquipment();
  }, []);

  async function loadLoans() {
    try {
      setLoading(true);
      const data = await fetchLoans();
      setLoans(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los préstamos');
      console.error('Error loading loans:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableEquipment() {
    try {
      const data = await fetchEquipment();
      setAvailableEquipment(data.filter(eq => eq.status === 'available'));
    } catch (err) {
      console.error('Error loading available equipment:', err);
    }
  }

  async function handleStatusUpdate(loanId: string, newStatus: Loan['status']) {
    try {
      setError(null);
      const actualReturnDate = newStatus === 'returned' ? new Date().toISOString() : undefined;
      await updateLoanStatus(loanId, newStatus, actualReturnDate);
      await loadLoans();
      await loadAvailableEquipment();
    } catch (err) {
      console.error('Error updating loan status:', err);
      setError('Error al actualizar el estado del préstamo');
    }
  }

  const handleEditClick = (loan: Loan) => {
    setEditingLoan(loan);
    setIsEditModalOpen(true);
  };

  const handleImageClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
  };

  const handleEditSubmit = async (updatedLoan: Partial<Loan>) => {
    try {
      setError(null);
      if (editingLoan) {
        await updateLoan(editingLoan.id, updatedLoan);
        await loadLoans();
        await loadAvailableEquipment();
        setIsEditModalOpen(false);
        setEditingLoan(null);
      }
    } catch (err) {
      console.error('Error updating loan:', err);
      setError('Error al actualizar el préstamo');
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.borrower_department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLoans = filteredLoans.filter(loan => loan.status === 'active' || loan.status === 'delayed');
  const loanHistory = filteredLoans.filter(loan => loan.status === 'returned' || loan.status === 'lost' || loan.status === 'damaged');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Préstamos de Equipos</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Préstamo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'active'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('active')}
              >
                Préstamos Activos
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'history'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Historial
              </button>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o departamento..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Préstamo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Devolución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accesorios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'active' ? activeLoans : loanHistory).map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {loan.borrower_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loan.borrower_department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        {loan.equipment?.model || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(loan.start_date), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(loan.expected_return_date), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LoanStatus status={loan.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-2">
                        {loan.accessories.map((accessory, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {accessory}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        {loan.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(loan.id, 'returned')}
                              className="text-green-600 hover:text-green-800"
                              title="Marcar como devuelto"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(loan.id, 'delayed')}
                              className="text-red-600 hover:text-red-800"
                              title="Marcar como retrasado"
                            >
                              <AlertCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditClick(loan)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar préstamo"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        {loan.equipment && (
                          <button
                            onClick={() => handleImageClick(loan.equipment!)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Ver imágenes"
                          >
                            <Image className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateLoanModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateLoan={async (loanData) => {
            try {
              await createLoan(loanData);
              await loadLoans();
              await loadAvailableEquipment();
              setIsCreateModalOpen(false);
            } catch (err) {
              console.error('Error creating loan:', err);
              setError('Error al crear el préstamo');
            }
          }}
          availableEquipment={availableEquipment}
        />
      )}

      {isEditModalOpen && editingLoan && (
        <EditLoanModal
          loan={editingLoan}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingLoan(null);
          }}
          onSave={handleEditSubmit}
          availableEquipment={availableEquipment}
        />
      )}

      {selectedEquipment && (
        <ImageModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
        />
      )}
    </div>
  );
}

function ImageModal({
  equipment,
  onClose
}: {
  equipment: Equipment;
  onClose: () => void;
}) {
  if (!equipment.imagenes?.length) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imágenes de {equipment.model}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            No hay imágenes disponibles para este equipo
          </div>
        </div>
      </div>
    );
  }

  if (equipment.imagenes.length === 1) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imagen de {equipment.model}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative aspect-video">
            <img
              src={equipment.imagenes[0]}
              alt={`${equipment.model}`}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Imágenes de {equipment.model}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: '.swiper-button-prev',
              nextEl: '.swiper-button-next',
            }}
            pagination={{ clickable: true }}
            className="w-full aspect-video"
          >
            {equipment.imagenes.map((imagen, index) => (
              <SwiperSlide key={index}>
                <img
                  src={imagen}
                  alt={`${equipment.model} - Imagen ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <button className="swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-md">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <button className="swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow-md">
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateLoanModal({
  onClose,
  onCreateLoan,
  availableEquipment
}: {
  onClose: () => void;
  onCreateLoan: (loanData: any) => Promise<void>;
  availableEquipment: Equipment[];
}) {
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_department: '',
    equipment_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    expected_return_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    accessories: [] as string[],
    notes: '',
    status: 'active' as const,
    fi_1557_filled: false,
    fi_1557_evidence: null as File | null
  });

  const [accessory, setAccessory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateLoan(formData);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nuevo Préstamo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Funcionario</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.borrower_name}
                onChange={e => setFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Departamento</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.borrower_department}
                onChange={e => setFormData(prev => ({ ...prev, borrower_department: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Equipo</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.equipment_id}
              onChange={e => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
            >
              <option value="">Seleccionar equipo</option>
              {availableEquipment.map(equipment => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.model} ({equipment.type}) {equipment.serial_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Préstamo</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Devolución</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.expected_return_date}
                onChange={e => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">¿Se diligenció el formato FI-1557?</label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={formData.fi_1557_filled}
                  onChange={e => setFormData(prev => ({ ...prev, fi_1557_filled: e.target.checked }))}
                />
                <span className="ml-2">Sí, el formato está diligenciado</span>
              </label>
            </div>
          </div>

          {formData.fi_1557_filled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Evidencia del formato FI-1557</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Cargar archivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
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

              {previewUrl && (
                <div className="mt-4">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Accesorios</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={accessory}
                onChange={e => setAccessory(e.target.value)}
                placeholder="Agregar accesorio"
              />
              <button
                type="button"
                onClick={addAccessory}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
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
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLoanModal({
  loan,
  onClose,
  onSave,
  availableEquipment
}: {
  loan: Loan;
  onClose: () => void;
  onSave: (loanData: Partial<Loan>) => Promise<void>;
  availableEquipment: Equipment[];
}) {
  const [formData, setFormData] = useState({
    borrower_name: loan.borrower_name,
    borrower_department: loan.borrower_department,
    equipment_id: loan.equipment_id,
    start_date: format(new Date(loan.start_date), 'yyyy-MM-dd'),
    expected_return_date: format(new Date(loan.expected_return_date), 'yyyy-MM-dd'),
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
    
    // Create a copy of formData without the fi_1557_evidence field
    const { fi_1557_evidence, ...restFormData } = formData;
    
    try {
      if (fi_1557_evidence) {
        // If there's a new file, upload it first
        const evidence = await uploadFI1557Evidence(loan.id, fi_1557_evidence);
        // Then update the loan with the new evidence and other data
        await onSave({
          ...restFormData,
          fi_1557_evidence: [evidence]
        });
      } else {
        // If no new file, just update with the rest of the data
        // Keep the existing fi_1557_evidence if it exists
        await onSave({
          ...restFormData,
          fi_1557_evidence: loan.fi_1557_evidence // Preserve existing evidence if any
        });
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      // You might want to show an error message to the user here
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Préstamo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Funcionario</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.borrower_name}
                onChange={e => setFormData(prev => ({ ...prev, borrower_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Departamento</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.borrower_department}
                onChange={e => setFormData(prev => ({ ...prev, borrower_department: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Equipo</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700">Fecha de Préstamo</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Devolución</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.expected_return_date}
                onChange={e => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700">¿Se diligenció el formato FI-1557?</label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={formData.fi_1557_filled}
                  onChange={e => setFormData(prev => ({ ...prev, fi_1557_filled: e.target.checked }))}
                />
                <span className="ml-2">Sí, el formato está diligenciado</span>
              </label>
            </div>
          </div>

          {formData.fi_1557_filled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Evidencia del formato FI-1557</label>
              
              {/* Mostrar evidencia existente si hay */}
              {loan.fi_1557_evidence && loan.fi_1557_evidence.length > 0 && !formData.fi_1557_evidence && (
                <div className="mt-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Evidencia actual:</p>
                  <img
                    src={loan.fi_1557_evidence[0].url}
                    alt="Evidencia actual"
                    className="max-h-48 rounded-lg"
                  />
                </div>
              )}

              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
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

              {/* Mostrar preview de la nueva imagen si se seleccionó una */}
              {formData.fi_1557_evidence && previewUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Nueva evidencia:</p>
                  <img
                    src={previewUrl}
                    alt="Nueva evidencia"
                    className="max-h-48 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Accesorios</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={accessory}
                onChange={e => setAccessory(e.target.value)}
                placeholder="Agregar accesorio"
              />
              <button
                type="button"
                onClick={addAccessory}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
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
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Loans;