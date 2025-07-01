import React, { useState, useEffect } from 'react';
import { Plus, Search, Laptop, Printer, Monitor, Edit2, Image } from 'lucide-react';
import type { Equipment } from '../../types';
import { fetchEquipment, createEquipment, updateEquipment } from '../../lib/supabase';
import EquipmentStatus from './EquipmentStatus';
import ImageModal from './ImageModal';
import EquipmentModal from './EquipmentModal';

const Inventory: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  async function loadEquipment() {
    try {
      setLoading(true);
      const data = await fetchEquipment();
      setEquipment(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el inventario');
      console.error('Error loading equipment:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsModalOpen(true);
  };

  const handleImageClick = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setIsImageModalOpen(true);
  };

  const filteredEquipment = equipment.filter(eq =>
    eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedEquipment(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Inventario de Equipos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Equipo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md">
                Total: {equipment.length}
              </div>
              <div className="px-4 py-2 bg-green-50 text-green-600 rounded-md">
                Disponibles: {equipment.filter(eq => eq.status === 'available').length}
              </div>
              <div className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-md">
                En préstamo: {equipment.filter(eq => eq.status === 'loaned').length}
              </div>
              <div className="px-4 py-2 bg-purple-50 text-purple-600 rounded-md">
                Inactivos: {equipment.filter(eq => eq.status === 'inactive').length}
              </div>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por modelo, serial o tipo..."
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo con No Serial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {eq.type === 'laptop' ? (
                          <Laptop className="h-5 w-5 text-gray-500 mr-2" />
                        ) : eq.type === 'printer' ? (
                          <Printer className="h-5 w-5 text-gray-500 mr-2" />
                        ) : (
                          <Monitor className="h-5 w-5 text-gray-500 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">{eq.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {eq.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {eq.serial_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EquipmentStatus status={eq.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(eq.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(eq)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleImageClick(eq)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Ver imágenes"
                        >
                          <Image className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EquipmentModal
          onClose={closeModal}
          onSubmit={async (equipmentData) => {
            try {
              if (editingEquipment) {
                await updateEquipment(editingEquipment.id, equipmentData);
              } else {
                await createEquipment(equipmentData);
              }
              await loadEquipment();
              closeModal();
            } catch (err) {
              console.error('Error saving equipment:', err);
              setError('Error al guardar el equipo');
            }
          }}
          equipment={editingEquipment}
        />
      )}

      {isImageModalOpen && selectedEquipment && (
        <ImageModal
          equipment={selectedEquipment}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
};

export default Inventory;