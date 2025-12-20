
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, PenTool, CreditCard } from 'lucide-react';
import { Coach } from '../types';
import { CATEGORIES } from '../constants';

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coach: Coach) => void;
  coach?: Coach;
}

const CoachModal: React.FC<CoachModalProps> = ({ isOpen, onClose, onSave, coach }) => {
  const [formData, setFormData] = useState<Partial<Coach>>({
    firstName: '',
    lastName: '',
    category: 'Sub-13',
    entryDate: new Date().toISOString().split('T')[0],
    phone: '',
    address: '',
    baseSalary: 0,
    bankAccount: '',
    photo: ''
  });

  useEffect(() => {
    if (coach) setFormData(coach);
  }, [coach]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(prev => ({ ...prev, [field]: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as Coach);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {coach ? 'Perfil del Entrenador' : 'Nuevo Integrante Técnico'}
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div className="w-full aspect-square rounded-[3rem] bg-slate-100 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                {formData.photo ? (
                  <img src={formData.photo} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-slate-300" />
                )}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <label className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotografía Perfil</label>
              
              <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 space-y-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                  <CreditCard className="w-5 h-5" /> Información Financiera
                </p>
                <div>
                   <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1">Cuenta para Nómina</label>
                   <input placeholder="Ej: Ahorros 123-..." value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold text-indigo-900 outline-none" />
                </div>
                <div>
                   <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1">Salario Base (Mensual)</label>
                   <input type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value)})} className="w-full bg-white border-none rounded-xl px-4 py-3 font-black text-emerald-600 outline-none" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombres</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Apellidos</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoría a Cargo</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha de Ingreso</label>
                    <input required type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none" />
                  </div>
               </div>

               <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Datos de Contacto</h4>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Celular Personal</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Residencia</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none" />
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex gap-6 pt-10 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cerrar</button>
            <button type="submit" className="flex-[3] py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">
              <Save className="w-6 h-6" /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachModal;
