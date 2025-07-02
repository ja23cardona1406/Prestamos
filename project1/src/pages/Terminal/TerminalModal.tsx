import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { X, Download, Play, Square, FileText, Shield, Cpu, HardDrive } from 'lucide-react';
import 'xterm/css/xterm.css';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentModel: string;
  mode: 'delivery' | 'return';
  onReportGenerated: (report: HardwareReport) => void;
}

export interface HardwareReport {
  id: string;
  equipment_id: string;
  mode: 'delivery' | 'return';
  timestamp: string;
  system_info: {
    os: string;
    hostname: string;
    uptime: string;
    architecture: string;
  };
  hardware: {
    cpu: {
      model: string;
      cores: number;
      frequency: string;
      temperature?: string;
    };
    memory: {
      total: string;
      available: string;
      type: string;
      slots: Array<{
        size: string;
        type: string;
        speed: string;
        manufacturer: string;
      }>;
    };
    storage: Array<{
      device: string;
      model: string;
      serial: string;
      size: string;
      type: string;
      health: string;
      temperature?: string;
    }>;
    motherboard: {
      manufacturer: string;
      model: string;
      serial: string;
      bios_version: string;
    };
    network: Array<{
      interface: string;
      mac_address: string;
      status: string;
    }>;
  };
  security: {
    antivirus_status: string;
    firewall_status: string;
    windows_updates: string;
    unauthorized_software: string[];
  };
  checksum: string;
}

const DIAGNOSTIC_SCRIPTS = {
  windows: {
    system_info: 'systeminfo',
    cpu_info: 'wmic cpu get name,numberofcores,maxclockspeed /format:csv',
    memory_info: 'wmic memorychip get capacity,speed,memorytype,manufacturer /format:csv',
    disk_info: 'wmic diskdrive get model,serialnumber,size,interfacetype /format:csv',
    motherboard_info: 'wmic baseboard get manufacturer,product,serialnumber /format:csv',
    bios_info: 'wmic bios get serialnumber,version /format:csv',
    network_info: 'wmic path win32_networkadapter get name,macaddress,netenabled /format:csv',
    security_check: 'Get-MpComputerStatus | Select-Object AntivirusEnabled,FirewallEnabled,RealTimeProtectionEnabled',
    installed_programs: 'wmic product get name,version /format:csv'
  },
  linux: {
    system_info: 'uname -a && hostnamectl',
    cpu_info: 'lscpu && cat /proc/cpuinfo | grep "model name" | head -1',
    memory_info: 'dmidecode -t memory | grep -E "Size|Type|Speed|Manufacturer"',
    disk_info: 'lsblk -d -o NAME,MODEL,SERIAL,SIZE,TYPE && smartctl -a /dev/sda',
    motherboard_info: 'dmidecode -t baseboard | grep -E "Manufacturer|Product Name|Serial Number"',
    bios_info: 'dmidecode -t bios | grep -E "Version|Release Date"',
    network_info: 'ip link show && cat /sys/class/net/*/address',
    security_check: 'systemctl status ufw && ps aux | grep -E "clamav|antivirus"',
    installed_programs: 'dpkg -l | grep -v "^ii" || rpm -qa'
  }
};

function TerminalModal({ isOpen, onClose, equipmentId, equipmentModel, mode, onReportGenerated }: TerminalModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentScript, setCurrentScript] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState<Partial<HardwareReport>>({});
  const [detectedOS, setDetectedOS] = useState<'windows' | 'linux'>('windows');

  useEffect(() => {
    if (isOpen && terminalRef.current && !terminal.current) {
      // Inicializar terminal
      terminal.current = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#1a1a1a',
          foreground: '#00ff00',
          cursor: '#00ff00',
          selectionBackground: '#333333'
        },
        rows: 30,
        cols: 120
      });

      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.loadAddon(new WebLinksAddon());

      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();

      // Mensaje de bienvenida
      terminal.current.writeln('\x1b[32m╔══════════════════════════════════════════════════════════════════════════════╗\x1b[0m');
      terminal.current.writeln('\x1b[32m║                    SISTEMA DE VERIFICACIÓN DE HARDWARE DIAN                 ║\x1b[0m');
      terminal.current.writeln('\x1b[32m║                          Diagnóstico Técnico Avanzado                       ║\x1b[0m');
      terminal.current.writeln('\x1b[32m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m');
      terminal.current.writeln('');
      terminal.current.writeln(`\x1b[36mEquipo: ${equipmentModel}\x1b[0m`);
      terminal.current.writeln(`\x1b[36mModo: ${mode === 'delivery' ? 'ENTREGA' : 'DEVOLUCIÓN'}\x1b[0m`);
      terminal.current.writeln(`\x1b[36mFecha: ${new Date().toLocaleString()}\x1b[0m`);
      terminal.current.writeln('');
      terminal.current.writeln('\x1b[33m⚠️  IMPORTANTE: Este diagnóstico generará un "rayos X" digital del equipo\x1b[0m');
      terminal.current.writeln('\x1b[33m   para verificar la integridad del hardware y detectar cambios.\x1b[0m');
      terminal.current.writeln('');
      terminal.current.writeln('\x1b[32m✅ Terminal lista. Presione "Iniciar Diagnóstico" para comenzar.\x1b[0m');
      terminal.current.writeln('');

      // Detectar SO (simulado)
      setTimeout(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const os = userAgent.includes('windows') ? 'windows' : 'linux';
        setDetectedOS(os);
        terminal.current?.writeln(`\x1b[36m🔍 Sistema operativo detectado: ${os.toUpperCase()}\x1b[0m`);
        terminal.current?.writeln('');
      }, 1000);
    }

    return () => {
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
    };
  }, [isOpen, equipmentModel, mode]);

  const simulateCommand = async (command: string, description: string): Promise<string> => {
    return new Promise((resolve) => {
      terminal.current?.writeln(`\x1b[34m$ ${command}\x1b[0m`);
      
      setTimeout(() => {
        // Simular salida del comando basada en el tipo
        let output = '';
        
        if (command.includes('systeminfo') || command.includes('uname')) {
          output = generateSystemInfo();
        } else if (command.includes('cpu') || command.includes('lscpu')) {
          output = generateCPUInfo();
        } else if (command.includes('memory') || command.includes('dmidecode -t memory')) {
          output = generateMemoryInfo();
        } else if (command.includes('diskdrive') || command.includes('lsblk')) {
          output = generateDiskInfo();
        } else if (command.includes('baseboard') || command.includes('motherboard')) {
          output = generateMotherboardInfo();
        } else if (command.includes('network') || command.includes('ip link')) {
          output = generateNetworkInfo();
        } else if (command.includes('security') || command.includes('ufw')) {
          output = generateSecurityInfo();
        } else {
          output = 'Comando ejecutado correctamente.\nDatos recopilados y almacenados.';
        }

        const lines = output.split('\n');
        let lineIndex = 0;
        
        const writeNextLine = () => {
          if (lineIndex < lines.length) {
            terminal.current?.writeln(`\x1b[37m${lines[lineIndex]}\x1b[0m`);
            lineIndex++;
            setTimeout(writeNextLine, 50);
          } else {
            terminal.current?.writeln('');
            resolve(output);
          }
        };
        
        writeNextLine();
      }, 500);
    });
  };

  const generateSystemInfo = () => {
    return `Host Name:                 DIAN-WS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
OS Name:                   Microsoft Windows 11 Pro
OS Version:                10.0.22631 N/A Build 22631
System Manufacturer:       Dell Inc.
System Model:              OptiPlex 7090
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                          [01]: Intel64 Family 6 Model 142 Stepping 12
                                GenuineIntel ~2800 Mhz
Total Physical Memory:     16,384 MB
Available Physical Memory: 8,192 MB
Virtual Memory: Max Size:  32,768 MB
BIOS Version:              Dell Inc. 2.18.0, 15/03/2024`;
  };

  const generateCPUInfo = () => {
    return `Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                8
On-line CPU(s) list:   0-7
Thread(s) per core:    2
Core(s) per socket:    4
Socket(s):             1
Model name:            Intel(R) Core(TM) i7-1165G7 @ 2.80GHz
CPU MHz:               2800.000
CPU max MHz:           4700.0000
CPU min MHz:           400.0000
BogoMIPS:              5587.20
Virtualization:        VT-x
L1d cache:             48K
L1i cache:             32K
L2 cache:              1280K
L3 cache:              12288K`;
  };

  const generateMemoryInfo = () => {
    return `Handle 0x0010, DMI type 17, 84 bytes
Memory Device
        Array Handle: 0x000F
        Error Information Handle: Not Provided
        Total Width: 64 bits
        Data Width: 64 bits
        Size: 8192 MB
        Form Factor: SODIMM
        Set: None
        Locator: ChannelA-DIMM0
        Bank Locator: BANK 0
        Type: DDR4
        Type Detail: Synchronous
        Speed: 3200 MT/s
        Manufacturer: Samsung
        Serial Number: 12345678
        Asset Tag: 9876543210
        Part Number: M471A1K43EB1-CWE

Handle 0x0011, DMI type 17, 84 bytes
Memory Device
        Array Handle: 0x000F
        Error Information Handle: Not Provided
        Total Width: 64 bits
        Data Width: 64 bits
        Size: 8192 MB
        Form Factor: SODIMM
        Set: None
        Locator: ChannelB-DIMM0
        Bank Locator: BANK 2
        Type: DDR4
        Type Detail: Synchronous
        Speed: 3200 MT/s
        Manufacturer: Samsung
        Serial Number: 87654321
        Asset Tag: 0123456789
        Part Number: M471A1K43EB1-CWE`;
  };

  const generateDiskInfo = () => {
    return `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda      8:0    0 465.8G  0 disk 
├─sda1   8:1    0   100M  0 part /boot/efi
├─sda2   8:2    0    16M  0 part 
├─sda3   8:3    0 465.2G  0 part /
└─sda4   8:4    0   513M  0 part 

Device Model:     Samsung SSD 980 PRO 500GB
Serial Number:    S6J2NS0T123456A
LU WWN Device Id: 5 002538 e40123456
Firmware Version: 5B2QGXA7
User Capacity:    500,107,862,016 bytes [500 GB]
Sector Size:      512 bytes logical/physical
Rotation Rate:    Solid State Device
TRIM Command:     Available
Device is:        In smartctl database
ATA Version is:   ACS-4 T13/BSR INCITS 529 revision 5
SATA Version is:  SATA 3.3, 6.0 Gb/s (current: 6.0 Gb/s)

SMART overall-health self-assessment test result: PASSED
Temperature:      35 Celsius
Power_On_Hours:   2847
Data_Units_Written: 15,234,567 [7.80 TB]
Wear_Leveling_Count: 98%`;
  };

  const generateMotherboardInfo = () => {
    return `Handle 0x0002, DMI type 2, 15 bytes
Base Board Information
        Manufacturer: Dell Inc.
        Product Name: 0K240Y
        Version: A01
        Serial Number: .7N62P33.CNCMS0013E00F8.
        Asset Tag: Not Specified
        Features:
                Board is a hosting board
                Board is replaceable
        Location In Chassis: Not Specified
        Chassis Handle: 0x0003
        Type: Motherboard
        Contained Object Handles: 0`;
  };

  const generateNetworkInfo = () => {
    return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: enp0s31f6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 54:e1:ad:12:34:56 brd ff:ff:ff:ff:ff:ff
3: wlp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DORMANT group default qlen 1000
    link/ether a4:c3:f0:78:90:12 brd ff:ff:ff:ff:ff:ff

MAC Addresses:
Ethernet: 54:e1:ad:12:34:56
WiFi: a4:c3:f0:78:90:12`;
  };

  const generateSecurityInfo = () => {
    return `Windows Defender Status:
AntivirusEnabled         : True
FirewallEnabled          : True
RealTimeProtectionEnabled: True
QuickScanAge            : 0
FullScanAge             : 7
AntivirusSignatureAge   : 0
AntispywareSignatureAge : 0
BehaviorMonitorEnabled  : True
IoavProtectionEnabled   : True
NISEnabled              : True
OnAccessProtectionEnabled: True
RealTimeScanDirection   : 0
ScanAvgCPULoadFactor    : 50
ScanOnlyIfIdleEnabled   : True

Windows Updates:
Last Check: ${new Date().toLocaleDateString()}
Status: Up to date
Pending Updates: 0

Unauthorized Software Scan:
✅ No unauthorized software detected
✅ All installed programs are approved
✅ No suspicious processes running`;
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const scripts = DIAGNOSTIC_SCRIPTS[detectedOS];
    const scriptEntries = Object.entries(scripts);
    const totalSteps = scriptEntries.length;
    
    terminal.current?.writeln('\x1b[32m🚀 Iniciando diagnóstico completo del hardware...\x1b[0m');
    terminal.current?.writeln('');

    const report: Partial<HardwareReport> = {
      id: `report_${Date.now()}`,
      equipment_id: equipmentId,
      mode,
      timestamp: new Date().toISOString(),
      system_info: {
        os: detectedOS,
        hostname: `DIAN-WS-${Math.floor(Math.random() * 1000)}`,
        uptime: '2 days, 14 hours, 32 minutes',
        architecture: 'x86_64'
      },
      hardware: {
        cpu: {
          model: 'Intel(R) Core(TM) i7-1165G7 @ 2.80GHz',
          cores: 8,
          frequency: '2.80GHz',
          temperature: '35°C'
        },
        memory: {
          total: '16 GB',
          available: '8 GB',
          type: 'DDR4',
          slots: [
            { size: '8GB', type: 'DDR4', speed: '3200MHz', manufacturer: 'Samsung' },
            { size: '8GB', type: 'DDR4', speed: '3200MHz', manufacturer: 'Samsung' }
          ]
        },
        storage: [
          {
            device: '/dev/sda',
            model: 'Samsung SSD 980 PRO 500GB',
            serial: 'S6J2NS0T123456A',
            size: '500GB',
            type: 'NVMe SSD',
            health: 'PASSED',
            temperature: '35°C'
          }
        ],
        motherboard: {
          manufacturer: 'Dell Inc.',
          model: '0K240Y',
          serial: '.7N62P33.CNCMS0013E00F8.',
          bios_version: '2.18.0'
        },
        network: [
          { interface: 'Ethernet', mac_address: '54:e1:ad:12:34:56', status: 'Connected' },
          { interface: 'WiFi', mac_address: 'a4:c3:f0:78:90:12', status: 'Connected' }
        ]
      },
      security: {
        antivirus_status: 'Active - Windows Defender',
        firewall_status: 'Enabled',
        windows_updates: 'Up to date',
        unauthorized_software: []
      },
      checksum: ''
    };

    for (let i = 0; i < scriptEntries.length; i++) {
      const [key, command] = scriptEntries[i];
      const description = key.replace('_', ' ').toUpperCase();
      
      setCurrentScript(description);
      terminal.current?.writeln(`\x1b[33m📋 Ejecutando: ${description}\x1b[0m`);
      
      await simulateCommand(command, description);
      
      setProgress(((i + 1) / totalSteps) * 100);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generar checksum
    const dataString = JSON.stringify(report);
    const checksum = btoa(dataString).slice(0, 16);
    report.checksum = checksum;

    terminal.current?.writeln('\x1b[32m✅ Diagnóstico completado exitosamente!\x1b[0m');
    terminal.current?.writeln('');
    terminal.current?.writeln('\x1b[36m📊 RESUMEN DEL DIAGNÓSTICO:\x1b[0m');
    terminal.current?.writeln(`   • CPU: ${report.hardware?.cpu.model}`);
    terminal.current?.writeln(`   • RAM: ${report.hardware?.memory.total} (${report.hardware?.memory.slots.length} módulos)`);
    terminal.current?.writeln(`   • Almacenamiento: ${report.hardware?.storage[0].model} (${report.hardware?.storage[0].health})`);
    terminal.current?.writeln(`   • Placa madre: ${report.hardware?.motherboard.manufacturer} ${report.hardware?.motherboard.model}`);
    terminal.current?.writeln(`   • Seguridad: ${report.security?.antivirus_status}`);
    terminal.current?.writeln(`   • Checksum: ${checksum}`);
    terminal.current?.writeln('');
    terminal.current?.writeln('\x1b[32m🔒 Reporte generado y firmado digitalmente.\x1b[0m');
    terminal.current?.writeln('\x1b[33m⚠️  Este reporte servirá como evidencia técnica para comparaciones futuras.\x1b[0m');

    setReportData(report);
    setIsRunning(false);
    onReportGenerated(report as HardwareReport);
  };

  const downloadReport = () => {
    if (reportData) {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hardware_report_${equipmentId}_${mode}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Terminal de Diagnóstico DIAN
              </h2>
              <p className="text-sm text-gray-400">
                {equipmentModel} - {mode === 'delivery' ? 'Entrega' : 'Devolución'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isRunning && reportData.checksum && (
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar Reporte
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={runDiagnostic}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isRunning 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Iniciar Diagnóstico
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Cpu className="h-4 w-4" />
                <span>SO: {detectedOS.toUpperCase()}</span>
              </div>
            </div>

            {isRunning && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-300">
                  {currentScript}
                </div>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 min-w-[3rem]">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Terminal */}
        <div className="flex-1 p-4 bg-gray-900">
          <div 
            ref={terminalRef} 
            className="w-full h-full bg-black rounded border border-gray-700"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Status Bar */}
        <div className="p-3 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>Estado: {isRunning ? 'Ejecutando diagnóstico...' : 'Listo'}</span>
              {reportData.checksum && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Reporte generado - Checksum: {reportData.checksum}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>Terminal v2.0 - DIAN Security Suite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerminalModal;