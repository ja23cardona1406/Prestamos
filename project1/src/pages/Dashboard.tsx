import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Laptop, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchLoans, fetchEquipment } from '../lib/supabase';
import type { Loan, Equipment } from '../types';
import { format } from 'date-fns';

export function Dashboard() {
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
      } catch (err) {
        setError('Error al cargar los datos');
        console.error('Error loading dashboard data:', err);
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

  const activeLoans = loans.filter(loan => loan.status === 'active').length;
  const availableEquipment = equipment.filter(eq => eq.status === 'available').length;
  const delayedLoans = loans.filter(loan => loan.status === 'delayed').length;
  
  const today = new Date().toISOString().split('T')[0];
  const returnsToday = loans.filter(loan => 
    loan.status === 'returned' && 
    loan.actual_return_date?.split('T')[0] === today
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Préstamos Activos"
          value={activeLoans.toString()}
          icon={Package}
          color="blue"
          href="/loans"
        />
        <DashboardCard
          title="Equipos Disponibles"
          value={availableEquipment.toString()}
          icon={Laptop}
          color="green"
          href="/inventory"
        />
        <DashboardCard
          title="Préstamos Retrasados"
          value={delayedLoans.toString()}
          icon={AlertTriangle}
          color="red"
          href="/loans"
        />
        <DashboardCard
          title="Devoluciones Hoy"
          value={returnsToday.toString()}
          icon={CheckCircle}
          color="purple"
          href="/loans"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentLoansTable loans={loans} />
        <LowStockAlert equipment={equipment} />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color, href }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  href: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Link
      to={href}
      className="block p-4 sm:p-6 bg-white rounded-lg shadow hover:shadow-md transition-all transform hover:scale-105"
    >
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="ml-3 sm:ml-4">
          <h2 className="text-xs sm:text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  );
}

function RecentLoansTable({ loans }: { loans: Loan[] }) {
  const recentLoans = loans
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Préstamos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funcionario
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="truncate max-w-32 sm:max-w-none">{loan.borrower_name}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="truncate max-w-24 sm:max-w-none">{loan.equipment?.model}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(loan.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <LoanStatus status={loan.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoanStatus({ status }: { status: Loan['status'] }) {
  const statusConfig = {
    active: { className: 'bg-green-100 text-green-800', text: 'Activo' },
    returned: { className: 'bg-gray-100 text-gray-800', text: 'Devuelto' },
    delayed: { className: 'bg-red-100 text-red-800', text: 'Retrasado' },
    lost: { className: 'bg-red-100 text-red-800', text: 'Extraviado' },
    damaged: { className: 'bg-yellow-100 text-yellow-800', text: 'Dañado' }
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
      {config.text}
    </span>
  );
}

function LowStockAlert({ equipment }: { equipment: Equipment[] }) {
  const LOW_STOCK_THRESHOLD = 3;
  
  const equipmentByType = equipment.reduce((acc, eq) => {
    if (eq.status === 'available') {
      acc[eq.type] = (acc[eq.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const lowStockItems = Object.entries(equipmentByType)
    .filter(([_, count]) => count <= LOW_STOCK_THRESHOLD)
    .map(([type, count]) => ({ type, count }));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Alerta de Stock Bajo</h2>
        <div className="space-y-3 sm:space-y-4">
          {lowStockItems.map(({ type, count }) => (
            <div key={type} className={`flex items-center justify-between p-3 sm:p-4 ${count <= 2 ? 'bg-red-50' : 'bg-yellow-50'} rounded-lg`}>
              <div className="flex items-center">
                <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${count <= 2 ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className={`ml-2 sm:ml-3 text-sm ${count <= 2 ? 'text-red-700' : 'text-yellow-700'}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s disponibles: {count} unidades
                </span>
              </div>
            </div>
          ))}
          {lowStockItems.length === 0 && (
            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="ml-2 sm:ml-3 text-sm text-green-700">
                  Todos los equipos tienen stock suficiente
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}