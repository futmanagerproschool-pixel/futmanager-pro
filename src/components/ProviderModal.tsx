import React, { useState, useEffect } from 'react';
import { X, Truck, IdentificationCard, User, Phone, MapPin, Mail, Save } from 'lucide-react';
import { Provider } from '../types';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: Provider) => void;
  provider?: Provider | null;
}

const DEFAULT_FORM: Partial<Provider> = {
  name: '',
  nit: '',
  contactName: '',
  phone: '',
  address: '',
  email: ''
};

const ProviderModal: React.FC<ProviderModalProps> = ({ isOpen, onClose, onSave, provider }) => {
  const [formData, setFormData] = useState<Partial<Provider>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      setFormData(provider || DEFAULT_FORM);
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as Provider);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Cabecera */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black italic tracking-tight uppercase text-emerald-400">Proveedores</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Gestión de Suministros Santa Marta FC</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors relative z-10">
            <X size={24} />
          </button>
          <Truck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 -rotate-12" />
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Empresa</label>
              <input required type="text" value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent"
                placeholder="Nombre de la empresa" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">NIT</label>
              <input required type="text" value={formData.nit} 
                onChange={e => setFormData({...formData, nit: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent"
                placeholder="900.xxx.xxx-x" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Contacto</label>
              <input required type="text" value={formData.contactName} 
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent"
                placeholder="Persona encargada" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Teléfono</label>
              <input required type="tel" value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent"
                placeholder="+57..." />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} 
              className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">
              Cerrar
            </button>
            <button type="submit" 
              className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl">
              <Save size={18} /> Guardar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderModal;
