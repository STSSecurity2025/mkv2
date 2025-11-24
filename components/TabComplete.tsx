import React, { useState } from 'react';
import { InputField } from './InputField';
import { CodeBlock } from './CodeBlock';
import { 
  generateBaseConfig, 
  generateWireGuardConfig, 
  generateDNATConfig, 
  generateWatchdogScripts, 
  generateServerCommands,
  ClientInfo,
  validateClientID
} from '../utils/generatorService';
import { Settings, Camera, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';

export const TabComplete: React.FC = () => {
  const [formData, setFormData] = useState<ClientInfo>({
    clientID: '',
    clientIPSuffix: '',
    clientWgIP: '',
    lanNetwork: '',
    dhcpStart: '10',
    dhcpEnd: '100',
    dnsServers: '8.8.8.8,8.8.4.4',
    clientPubKey: '',
    setupDNAT: false,
    cameraType: 'Dahua',
    numCameras: 1,
    cameraIPs: ['']
  });

  const [generated, setGenerated] = useState<{
    base: string;
    wireguard: string;
    dnat: string;
    watchdog: string;
    server: string;
    cameraUrls: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    
    if (id.startsWith('camera-')) {
      const index = parseInt(id.split('-')[1]);
      const newIPs = [...(formData.cameraIPs || [])];
      newIPs[index] = value;
      setFormData(prev => ({ ...prev, cameraIPs: newIPs }));
      return;
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [id]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleNumCamerasChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const num = parseInt(e.target.value) || 0;
    // Resize array while keeping existing values
    const currentIPs = formData.cameraIPs || [];
    const newIPs = Array(num).fill('').map((_, i) => currentIPs[i] || '');
    setFormData(prev => ({ ...prev, numCameras: num, cameraIPs: newIPs }));
  };

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validID = validateClientID(formData.clientID);
    if (!validID) {
      setError('ID de Cliente inválido. Use solo letras, números y guiones.');
      return;
    }

    const fullInfo: ClientInfo = {
      ...formData,
      clientID: validID,
      clientWgIP: `100.100.100.${formData.clientIPSuffix}`,
      portBase: formData.setupDNAT ? 8000 + (parseInt(formData.clientIPSuffix) * 10) : 0
    };

    // Camera validation
    if (fullInfo.setupDNAT && fullInfo.cameraIPs) {
      for (let i = 0; i < (fullInfo.numCameras || 0); i++) {
        if (!fullInfo.cameraIPs[i]) {
          setError(`Falta la IP de la Cámara ${i + 1}`);
          return;
        }
      }
    }

    // Generate Configs
    const base = generateBaseConfig(fullInfo);
    const wireguard = generateWireGuardConfig(fullInfo);
    const dnat = fullInfo.setupDNAT ? generateDNATConfig(fullInfo) : '';
    const watchdog = generateWatchdogScripts(fullInfo);
    const server = generateServerCommands(fullInfo);

    // Generate URLs text
    let urls = '';
    if (fullInfo.setupDNAT && fullInfo.cameraIPs && fullInfo.portBase) {
        fullInfo.cameraIPs.forEach((ip, i) => {
            const camNum = i + 1;
            const http = (fullInfo.portBase || 0) + camNum;
            const rtsp = (fullInfo.portBase || 0) + camNum + 50;
            urls += `CAMARA ${camNum} (${ip}):\n`;
            urls += `HTTP: http://${fullInfo.clientWgIP}:${http}\n`;
            urls += `RTSP: rtsp://${fullInfo.clientWgIP}:${rtsp}/...\n\n`;
        });
    }

    setGenerated({ base, wireguard, dnat, watchdog, server, cameraUrls: urls });
    
    // Smooth scroll to results
    setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Generador Completo</p>
          Esta herramienta crea un script "Todo en Uno" incluyendo el nuevo sistema <strong>Watchdog Seguro</strong> que no apaga la interfaz para evitar pérdidas de conexión.
        </div>
      </div>

      <form onSubmit={generate}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CLIENT INFO */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                    id="clientID" 
                    label="ID Cliente" 
                    value={formData.clientID} 
                    onChange={handleInputChange} 
                    placeholder="Ej: MC30, EMPRESA-01" 
                    required 
                    helperText="Solo letras, números y guiones."
                />
                <InputField 
                    id="clientIPSuffix" 
                    label="Sufijo IP WireGuard (último octeto)" 
                    value={formData.clientIPSuffix} 
                    onChange={handleInputChange} 
                    type="number" 
                    min={2} 
                    max={254} 
                    placeholder="Ej: 30" 
                    required 
                    helperText="Si es 30, la IP será 100.100.100.30"
                />
            </div>
          </div>

          {/* LAN CONFIG */}
          <div className="col-span-1 md:col-span-2">
             <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 mt-2">Red Local</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                    id="lanNetwork" 
                    label="Red LAN (3 primeros octetos)" 
                    value={formData.lanNetwork || ''} 
                    onChange={handleInputChange} 
                    placeholder="Ej: 192.168.28" 
                    required 
                />
                 <InputField 
                    id="dnsServers" 
                    label="Servidores DNS" 
                    value={formData.dnsServers || ''} 
                    onChange={handleInputChange} 
                    options={[
                        {value: '8.8.8.8,8.8.4.4', label: 'Google'},
                        {value: '1.1.1.1,1.0.0.1', label: 'Cloudflare'},
                        {value: '208.67.222.222,208.67.220.220', label: 'OpenDNS'}
                    ]}
                />
                <InputField 
                    id="dhcpStart" 
                    label="Inicio DHCP" 
                    value={formData.dhcpStart || ''} 
                    onChange={handleInputChange} 
                    type="number" 
                />
                <InputField 
                    id="dhcpEnd" 
                    label="Fin DHCP" 
                    value={formData.dhcpEnd || ''} 
                    onChange={handleInputChange} 
                    type="number" 
                />
             </div>
          </div>

          {/* WG KEY */}
          <div className="col-span-1 md:col-span-2">
            <InputField 
                id="clientPubKey" 
                label="Public Key del Cliente (MikroTik)" 
                value={formData.clientPubKey || ''} 
                onChange={handleInputChange} 
                isTextArea 
                placeholder="Pegar la clave pública generada en el MikroTik" 
                required 
            />
          </div>

          {/* CAMERAS */}
          <div className="col-span-1 md:col-span-2 bg-slate-50 p-6 rounded-lg border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <input 
                    type="checkbox" 
                    id="setupDNAT" 
                    checked={formData.setupDNAT} 
                    onChange={handleInputChange} 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="setupDNAT" className="font-bold text-slate-700 cursor-pointer select-none flex items-center gap-2">
                    <Camera className="w-5 h-5" /> Configurar Cámaras (DNAT)
                </label>
             </div>

             {formData.setupDNAT && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <InputField 
                            id="cameraType" 
                            label="Marca DVR/NVR" 
                            value={formData.cameraType || 'Dahua'} 
                            onChange={handleInputChange} 
                            options={[
                                {value: 'Dahua', label: 'Dahua'},
                                {value: 'Hikvision', label: 'Hikvision'}
                            ]}
                        />
                        <InputField 
                            id="numCameras" 
                            label="Cantidad de Cámaras" 
                            value={formData.numCameras || 1} 
                            onChange={handleNumCamerasChange} 
                            type="number"
                            min={1}
                            max={20}
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Direcciones IP de las Cámaras</label>
                        {formData.cameraIPs?.map((ip, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-slate-500 w-16">CAM {idx + 1}</span>
                                <input 
                                    type="text" 
                                    id={`camera-${idx}`} 
                                    value={ip} 
                                    onChange={handleInputChange} 
                                    className="flex-1 px-3 py-2 border rounded text-sm"
                                    placeholder={`192.168.x.x`}
                                    required
                                />
                            </div>
                        ))}
                     </div>
                 </div>
             )}
          </div>
        </div>

        {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        )}

        <div className="mt-8 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                <PlayCircle className="w-5 h-5" /> Generar Configuración
            </button>
            <button 
                type="button" 
                onClick={() => setGenerated(null)} 
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
                Limpiar
            </button>
        </div>
      </form>

      {/* RESULTS */}
      {generated && (
          <div id="results-section" className="mt-12 space-y-8 border-t border-slate-200 pt-10 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">🚀 Scripts Generados</h2>
              
              <CodeBlock 
                number={1} 
                title="Configuración Base (LAN, DHCP, DNS)" 
                code={generated.base} 
                filename={`${formData.clientID}_01_base.rsc`} 
              />
              
              <CodeBlock 
                number={2} 
                title="WireGuard Cliente" 
                code={generated.wireguard} 
                filename={`${formData.clientID}_02_wireguard.rsc`} 
              />
              
              {generated.dnat && (
                <CodeBlock 
                    number={3} 
                    title="Reglas DNAT (Cámaras)" 
                    code={generated.dnat} 
                    filename={`${formData.clientID}_03_dnat.rsc`} 
                />
              )}
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-5 h-5" /> Nuevo Watchdog "Safe Pulse"
                  </h4>
                  <p className="text-sm text-amber-700">
                      Este script verifica el ping. Si falla, <strong>cambia temporalmente el puerto de escucha</strong> para reiniciar el socket sin deshabilitar la interfaz. Mucho más seguro.
                  </p>
              </div>

              <CodeBlock 
                number={4} 
                title="Watchdog Automático" 
                code={generated.watchdog} 
                filename={`${formData.clientID}_04_watchdog.rsc`} 
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  <CodeBlock 
                    title="Comandos para el SERVIDOR (Pegar en el Core)" 
                    code={generated.server} 
                  />
                  {generated.cameraUrls && (
                     <CodeBlock 
                        title="URLs de Acceso Remoto" 
                        code={generated.cameraUrls} 
                     />
                  )}
              </div>
          </div>
      )}
    </div>
  );
};