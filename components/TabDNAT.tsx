import React, { useState } from 'react';
import { InputField } from './InputField';
import { CodeBlock } from './CodeBlock';
import { 
  generateDNATConfig, 
  ClientInfo,
  validateClientID
} from '../utils/generatorService';
import { Video, PlayCircle, AlertCircle } from 'lucide-react';

export const TabDNAT: React.FC = () => {
  const [formData, setFormData] = useState<ClientInfo>({
    clientID: '',
    clientIPSuffix: '',
    clientWgIP: '',
    numCameras: 1,
    cameraIPs: [''],
    cameraType: 'Dahua'
  });

  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id.startsWith('camera-')) {
        const index = parseInt(id.split('-')[1]);
        const newIPs = [...(formData.cameraIPs || [])];
        newIPs[index] = value;
        setFormData(prev => ({ ...prev, cameraIPs: newIPs }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseInt(e.target.value) || 1;
      const currentIPs = formData.cameraIPs || [];
      const newIPs = Array(num).fill('').map((_, i) => currentIPs[i] || '');
      setFormData(prev => ({ ...prev, numCameras: num, cameraIPs: newIPs }));
  };

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validID = validateClientID(formData.clientID);
    if (!validID) { setError('ID inválido'); return; }

    const info = {
        ...formData,
        clientID: validID,
        clientWgIP: `100.100.100.${formData.clientIPSuffix}`,
        portBase: 8000 + (parseInt(formData.clientIPSuffix) * 10)
    };

    const config = generateDNATConfig(info);
    setGenerated(config);
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-600" /> Reglas DNAT (Acceso Remoto)
            </h3>
            
            <form onSubmit={generate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="clientID" label="ID Cliente" value={formData.clientID} onChange={handleInputChange} required />
                    <InputField id="clientIPSuffix" label="Sufijo IP" value={formData.clientIPSuffix} onChange={handleInputChange} type="number" required />
                    <InputField id="numCameras" label="Nº Cámaras" value={formData.numCameras || 1} onChange={handleNumChange} type="number" min={1} max={20} />
                    <div className="mt-8 text-sm text-slate-500">
                        Base de puertos automática: 8000 + (Sufijo * 10)
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {formData.cameraIPs?.map((ip, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <span className="font-mono text-xs font-bold w-12 text-slate-500">CAM {i+1}</span>
                            <input 
                                type="text" 
                                id={`camera-${i}`}
                                value={ip}
                                onChange={handleInputChange}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="192.168.x.x"
                                required
                            />
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-600 mt-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

                <button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                    <PlayCircle className="w-5 h-5" /> Generar Reglas
                </button>
            </form>
        </div>

        {generated && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CodeBlock title="Reglas DNAT" code={generated} filename={`dnat_${formData.clientID}.rsc`} />
            </div>
        )}
    </div>
  );
};