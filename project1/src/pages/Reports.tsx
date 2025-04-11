import React, { useState, useEffect } from 'react';
import { fetchLoans, fetchEquipment } from '../lib/supabase';
import type { Loan, Equipment } from '../types';
import { BarChart, FileText, Users,  Clock } from 'lucide-react';



export function Reports() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    async function loadData() {
      try {
        const [loansData, equipmentData] = await Promise.all([
          fetchLoans(),
          fetchEquipment()
        ]);
        setLoans(loansData);
        setEquipment(equipmentData);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos');
        console.error('Error loading report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  // Calculate statistics
  const totalLoans = loans.length;
  const activeLoans = loans.filter(loan => loan.status === 'active').length;
  const delayedLoans = loans.filter(loan => loan.status === 'delayed').length;
  const returnRate = totalLoans > 0 
    ? ((loans.filter(loan => loan.status === 'returned').length / totalLoans) * 100).toFixed(1)
    : '0';

  const departmentStats = loans.reduce((acc, loan) => {
    acc[loan.borrower_department] = (acc[loan.borrower_department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  

  const topDepartments = Object.entries(departmentStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

    type EquipmentStatus = 'available' | 'loaned' | 'maintenance' | 'damaged' | 'lost';

    const statusInfo: Record<EquipmentStatus, { color: string; icon: string; label: string }> = {
      available: {
        color: 'bg-green-100 text-green-800',
        icon: '✅',
        label: 'Disponible',
      },
      loaned: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: '📚',
        label: 'Prestado',
      },
      maintenance: {
        color: 'bg-blue-100 text-blue-800',
        icon: '🛠️',
        label: 'Mantenimiento',
      },
      damaged: {
        color: 'bg-gray-200 text-gray-800',
        icon: '⚠️',
        label: 'Dañado',
      },
      lost: {
        color: 'bg-red-100 text-red-800',
        icon: '❌',
        label: 'Perdido',
      },
    };
    


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reportes y Estadísticas</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Préstamos"
          value={totalLoans.toString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Préstamos Activos"
          value={activeLoans.toString()}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Préstamos Retrasados"
          value={delayedLoans.toString()}
          icon={Clock}
          color="red"
        />
        <StatCard
          title="Tasa de Devolución"
          value={`${returnRate}%`}
          icon={BarChart}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Departamentos con más Préstamos
          </h2>
          <div className="space-y-4">
            {topDepartments.map(([department, count]) => (
              <div key={department} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{department}</span>
                <div className="flex items-center">
                  <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${(count / totalLoans) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Estado del Inventario
          </h2>
          <div className="space-y-4">
            {['available', 'loaned', 'maintenance', 'damaged', 'lost'].map(status => {
              const count = equipment.filter(eq => eq.status === status).length;
              const percentage = ((count / equipment.length) * 100).toFixed(1);
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                  <div className="flex items-center">
                    <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className={`h-2.5 rounded-full ${
                          status === 'available' ? 'bg-green-600' :
                          status === 'loaned' ? 'bg-yellow-600' :
                          status === 'maintenance' ? 'bg-blue-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {(['available', 'loaned', 'maintenance', 'damaged', 'lost'] as EquipmentStatus[]).map((status) => {
  const count = equipment.filter((eq) => eq.status === status).length;
  const percentage = ((count / equipment.length) * 100).toFixed(1);
  const { color, icon, label } = statusInfo[status];

  return (
    <div
      key={status}
      className={`rounded-lg p-4 shadow-sm flex items-center space-x-4 ${color}`}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs">{count} recursos ({percentage}%)</div>
      </div>
    </div>
  );
})}

    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
    
  );
}