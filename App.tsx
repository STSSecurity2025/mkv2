import React, { useState } from 'react';
import { TabComplete } from './components/TabComplete';
import { TabWireGuard } from './components/TabWireGuard';
import { TabDNAT } from './components/TabDNAT';
import { ShieldCheck, Network, Video, Server } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'complete' | 'wireguard' | 'dnat'>('complete');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <Server className="w-8 h-8 text-blue-400" />
              Generador MikroTik Pro
            </h1>
            <p className="text-blue-100 opacity-90 max-w-2xl mx-auto">
              WireGuard + DNAT + <strong>Nuevo Watchdog "Non-Stop"</strong>. Genera scripts seguros que mantienen tu conexión estable sin apagar interfaces.
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white sticky top-0 z-20">
          <button
            onClick={() => setActiveTab('complete')}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'complete'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Configuración Completa
          </button>
          <button
            onClick={() => setActiveTab('wireguard')}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'wireguard'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Network className="w-4 h-4" />
            Solo WireGuard
          </button>
          <button
            onClick={() => setActiveTab('dnat')}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dnat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4" />
            Solo DNAT
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 bg-slate-50 min-h-[600px]">
          {activeTab === 'complete' && <TabComplete />}
          {activeTab === 'wireguard' && <TabWireGuard />}
          {activeTab === 'dnat' && <TabDNAT />}
        </div>
      </div>
      
      <div className="text-center mt-8 text-slate-500 text-sm">
        <p>Optimizado para RouterOS v7.x</p>
      </div>

       <a href="https://n8n.cr-safe.com/webhook/mikrotik-menu" className="fixed bottom-8 left-8 bg-white text-blue-600 px-6 py-3 rounded-full shadow-lg border-2 border-blue-100 hover:border-blue-600 hover:-translate-y-1 transition-all font-semibold flex items-center gap-2 z-50">
          <span>⬅️</span> Volver al Menú
        </a>
    </div>
  );
};

export default App;