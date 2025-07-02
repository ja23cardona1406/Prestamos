import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Shield, AlertTriangle, CheckCircle, GitCompare as Compare, Calendar, Cpu, HardDrive } from 'lucide-react';
import type { HardwareReport } from '../Terminal/TerminalModal';

interface HardwareReportsProps {
  equipmentId?: string;
}

function HardwareReports({ equipmentId }: HardwareReportsProps) {
  const [reports, setReports] = useState<HardwareReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<HardwareReport | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareReports, setCompareReports] = useState<[HardwareReport | null, HardwareReport | null]>([null, null]);

  useEffect(() => {
    loadReports();
  }, [equipmentId]);

  const loadReports = () => {
    // Simular carga de reportes desde localStorage o API
    const savedReports = localStorage.getItem('hardware_reports');
    if (savedReports) {
      const allReports = JSON.parse(savedReports) as HardwareReport[];
      const filteredReports = equipmentId 
        ? allReports.filter(r => r.equipment_id === equipmentId)
        : allReports;
      setReports(filteredReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  };

  const saveReport = (report: HardwareReport) => {
    const savedReports = localStorage.getItem('hardware_reports');
    const allReports = savedReports ? JSON.parse(savedReports) : [];
    allReports.push(report);
    localStorage.setItem('hardware_reports', JSON.stringify(allReports));
    loadReports();
  };

  const downloadReport = (report: HardwareReport) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardware_report_${report.equipment_id}_${report.mode}_${new Date(report.timestamp).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateComparisonReport = () => {
    const [deliveryReport, returnReport] = compareReports;
    if (!deliveryReport || !returnReport) return null;

    const differences = [];

    // Comparar CPU
    if (deliveryReport.hardware.cpu.model !== returnReport.hardware.cpu.model) {
      differences.push({
        component: 'CPU',
        field: 'Modelo',
        delivery: deliveryReport.hardware.cpu.model,
        return: returnReport.hardware.cpu.model,
        severity: 'critical'
      });
    }

    // Comparar memoria
    if (deliveryReport.hardware.memory.total !== returnReport.hardware.memory.total) {
      differences.push({
        component: 'Memoria',
        field: 'Total',
        delivery: deliveryReport.hardware.memory.total,
        return: returnReport.hardware.memory.total,
        severity: 'critical'
      });
    }

    // Comparar almacenamiento
    const deliveryStorage = deliveryReport.hardware.storage[0];
    const returnStorage = returnReport.hardware.storage[0];
    
    if (deliveryStorage.serial !== returnStorage.serial) {
      differences.push({
        component: 'Almacenamiento',
        field: 'Número de serie',
        delivery: deliveryStorage.serial,
        return: returnStorage.serial,
        severity: 'critical'
      });
    }

    if (deliveryStorage.health !== returnStorage.health) {
      differences.push({
        component: 'Almacenamiento',
        field: 'Estado de salud',
        delivery: deliveryStorage.health,
        return: returnStorage.health,
        severity: 'warning'
      });
    }

    // Comparar placa madre
    if (deliveryReport.hardware.motherboard.serial !== returnReport.hardware.motherboard.serial) {
      differences.push({
        component: 'Placa Madre',
        field: 'Número de serie',
        delivery: deliveryReport.hardware.motherboard.serial,
        return: returnReport.hardware.motherboard.serial,
        severity: 'critical'
      });
    }

    // Comparar interfaces de red
    const deliveryMACs = deliveryReport.hardware.network.map(n => n.mac_address).sort();
    const returnMACs = returnReport.hardware.network.map(n => n.mac_address).sort();
    
    if (JSON.stringify(deliveryMACs) !== JSON.stringify(returnMACs)) {
      differences.push({
        component: 'Red',
        field: 'Direcciones MAC',
        delivery: deliveryMACs.join(', '),
        return: returnMACs.join(', '),
        severity: 'warning'
      });
    }

    return {
      deliveryDate: new Date(deliveryReport.timestamp).toLocaleString(),
      returnDate: new Date(returnReport.timestamp).toLocaleString(),
      differences,
      status: differences.length === 0 ? 'identical' : 
              differences.some(d => d.severity === 'critical') ? 'critical' : 'warning'
    };
  };

  const comparison = compareMode ? generateComparisonReport() : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Reportes de Hardware</h2>
          <p className="text-gray-600">Historial de diagnósticos técnicos y verificaciones</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              compareMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Compare className="h-4 w-4" />
            {compareMode ? 'Salir de comparación' : 'Comparar reportes'}
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">Modo de Comparación</h3>
          <p className="text-blue-700 text-sm mb-4">
            Seleccione dos reportes para compararlos y detectar cambios en el hardware.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Reporte de Entrega
              </label>
              <select
                className="w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={compareReports[0]?.id || ''}
                onChange={(e) => {
                  const report = reports.find(r => r.id === e.target.value);
                  setCompareReports([report || null, compareReports[1]]);
                }}
              >
                <option value="">Seleccionar reporte...</option>
                {reports.filter(r => r.mode === 'delivery').map(report => (
                  <option key={report.id} value={report.id}>
                    {new Date(report.timestamp).toLocaleDateString()} - Entrega
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Reporte de Devolución
              </label>
              <select
                className="w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={compareReports[1]?.id || ''}
                onChange={(e) => {
                  const report = reports.find(r => r.id === e.target.value);
                  setCompareReports([compareReports[0], report || null]);
                }}
              >
                <option value="">Seleccionar reporte...</option>
                {reports.filter(r => r.mode === 'return').map(report => (
                  <option key={report.id} value={report.id}>
                    {new Date(report.timestamp).toLocaleDateString()} - Devolución
                  </option>
                ))}
              </select>
            </div>
          </div>

          {comparison && (
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                {comparison.status === 'identical' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : comparison.status === 'critical' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <h4 className="font-medium">
                  {comparison.status === 'identical' 
                    ? 'Hardware idéntico - Sin cambios detectados'
                    : `${comparison.differences.length} diferencia(s) detectada(s)`
                  }
                </h4>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Entrega: {comparison.deliveryDate}</p>
                <p>Devolución: {comparison.returnDate}</p>
              </div>

              {comparison.differences.length > 0 && (
                <div className="space-y-3">
                  {comparison.differences.map((diff, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        diff.severity === 'critical' 
                          ? 'bg-red-50 border-red-400' 
                          : 'bg-yellow-50 border-yellow-400'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {diff.component} - {diff.field}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Entrega: {diff.delivery}</div>
                        <div>Devolución: {diff.return}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hardware Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checksum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No hay reportes de hardware disponibles
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(report.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.mode === 'delivery' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {report.mode === 'delivery' ? 'Entrega' : 'Devolución'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.equipment_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Cpu className="h-3 w-3 mr-1" />
                            <span className="text-xs">{report.hardware.cpu.model.substring(0, 30)}...</span>
                          </div>
                          <div className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1" />
                            <span className="text-xs">{report.hardware.storage[0].model}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {report.checksum}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadReport(report)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Descargar reporte"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de detalles del reporte */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Detalles del Reporte de Hardware</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información General</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Fecha:</span> {new Date(selectedReport.timestamp).toLocaleString()}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedReport.mode === 'delivery' ? 'Entrega' : 'Devolución'}</p>
                      <p><span className="font-medium">SO:</span> {selectedReport.system_info.os}</p>
                      <p><span className="font-medium">Hostname:</span> {selectedReport.system_info.hostname}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Seguridad</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Antivirus:</span> {selectedReport.security.antivirus_status}</p>
                      <p><span className="font-medium">Firewall:</span> {selectedReport.security.firewall_status}</p>
                      <p><span className="font-medium">Updates:</span> {selectedReport.security.windows_updates}</p>
                      <p><span className="font-medium">Checksum:</span> {selectedReport.checksum}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Hardware</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">CPU</h5>
                      <div className="text-sm space-y-1">
                        <p>{selectedReport.hardware.cpu.model}</p>
                        <p>{selectedReport.hardware.cpu.cores} núcleos @ {selectedReport.hardware.cpu.frequency}</p>
                        {selectedReport.hardware.cpu.temperature && (
                          <p>Temperatura: {selectedReport.hardware.cpu.temperature}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Memoria</h5>
                      <div className="text-sm space-y-1">
                        <p>Total: {selectedReport.hardware.memory.total}</p>
                        <p>Disponible: {selectedReport.hardware.memory.available}</p>
                        <p>Tipo: {selectedReport.hardware.memory.type}</p>
                        <p>Módulos: {selectedReport.hardware.memory.slots.length}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Almacenamiento</h5>
                      <div className="text-sm space-y-1">
                        <p>{selectedReport.hardware.storage[0].model}</p>
                        <p>Serial: {selectedReport.hardware.storage[0].serial}</p>
                        <p>Tamaño: {selectedReport.hardware.storage[0].size}</p>
                        <p>Estado: {selectedReport.hardware.storage[0].health}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Placa Madre</h5>
                      <div className="text-sm space-y-1">
                        <p>{selectedReport.hardware.motherboard.manufacturer}</p>
                        <p>Modelo: {selectedReport.hardware.motherboard.model}</p>
                        <p>Serial: {selectedReport.hardware.motherboard.serial}</p>
                        <p>BIOS: {selectedReport.hardware.motherboard.bios_version}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interfaces de Red</h4>
                  <div className="space-y-2">
                    {selectedReport.hardware.network.map((net, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <p><span className="font-medium">{net.interface}:</span> {net.mac_address} ({net.status})</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HardwareReports;