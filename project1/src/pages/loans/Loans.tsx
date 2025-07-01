import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Calendar, AlertCircle, CheckCircle, Edit2, Image } from 'lucide-react';
import type { Loan, Equipment } from '../../types';
import { fetchLoans, updateLoanStatus, createLoan, fetchEquipment, updateLoan } from '../../lib/supabase';
import { adjustDateOffset, formatDisplayDate } from '../../utils/dateUtils';
import LoanStatus from './LoanStatus';
import ImageModal from './ImageModal';
import CreateLoanModal from './CreateLoanModal';
import EditLoanModal from './EditLoanModal';

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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'active'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('active')}
              >
                Préstamos Activos
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
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
                        {formatDisplayDate(loan.start_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDisplayDate(loan.expected_return_date)}
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
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Marcar como devuelto"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(loan.id, 'delayed')}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Marcar como retrasado"
                            >
                              <AlertCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditClick(loan)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar préstamo"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        {loan.equipment && (
                          <button
                            onClick={() => handleImageClick(loan.equipment!)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
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
              const adjustedData = {
                ...loanData,
                start_date: adjustDateOffset(loanData.start_date),
                expected_return_date: adjustDateOffset(loanData.expected_return_date)
              };
              await createLoan(adjustedData);
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
          onSave={async (updatedLoan) => {
            const adjustedLoan = {
              ...updatedLoan,
              start_date: updatedLoan.start_date ? adjustDateOffset(updatedLoan.start_date) : undefined,
              expected_return_date: updatedLoan.expected_return_date ? adjustDateOffset(updatedLoan.expected_return_date) : undefined,
            };
            
            await handleEditSubmit(adjustedLoan);
          }}
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

export default Loans;