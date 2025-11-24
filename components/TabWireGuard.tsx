import React, { useState } from 'react';
import { InputField } from './InputField';
import { CodeBlock } from './CodeBlock';
import { 
  generateWireGuardConfig, 
  generateServerCommands,
  ClientInfo,
  validateClientID
} from '../utils/generatorService';
import { Network, PlayCircle, AlertCircle } from 'lucide-react';

export const TabWireGuard: React.FC = () => {
  const [formData, setFormData] = useState<ClientInfo>({
    clientID: '',
    clientIPSuffix: '',
    clientWgIP: '',
    clientPubKey: '',
    includeLanNetwork: false,
    lanNetwork: ''
  });

  const [generated, setGenerated] = useState<{ wg: string; server: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [id]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validID = validateClientID(formData.clientID);
    if (!validID) {
      setError('ID inválido.');
      return;
    }

    const info = {
        ...formData,
        clientID: validID,
        clientWgIP: `100.100.100.${formData.clientIPSuffix}`
    };

    const wg = generateWireGuardConfig(info);
    const server = generateServerCommands(info);

    setGenerated({ wg, server });
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Network className="w-6 h-6 text-blue-600" /> Generar Solo WireGuard
            </h3>
            
            <form onSubmit={generate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        id="clientID" 
                        label="ID Cliente" 
                        value={formData.clientID} 
                        onChange={handleInputChange} 
                        required 
                    />
                    <InputField 
                        id="clientIPSuffix" 
                        label="Sufijo IP" 
                        value={formData.clientIPSuffix} 
                        onChange={handleInputChange} 
                        type="number"
                        required 
                    />
                </div>
                
                <InputField 
                    id="clientPubKey" 
                    label="Public Key" 
                    value={formData.clientPubKey || ''} 
                    onChange={handleInputChange} 
                    isTextArea
                    required 
                />

                <div className="mb-6 flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="includeLanNetwork" 
                        checked={formData.includeLanNetwork} 
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeLanNetwork" className="text-sm font-semibold text-slate-700">Incluir ruteo a Red LAN</label>
                </div>

                {formData.includeLanNetwork && (
                    <InputField 
                        id="lanNetwork" 
                        label="Red LAN (Ej: 192.168.88)" 
                        value={formData.lanNetwork || ''} 
                        onChange={handleInputChange} 
                    />
                )}

                {error && <p className="text-red-600 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                    <PlayCircle className="w-5 h-5" /> Generar Código
                </button>
            </form>
        </div>

        {generated && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CodeBlock title="Configuración Cliente" code={generated.wg} filename={`wg_${formData.clientID}.rsc`} />
                <CodeBlock title="Comandos Servidor" code={generated.server} />
            </div>
        )}
    </div>
  );
};