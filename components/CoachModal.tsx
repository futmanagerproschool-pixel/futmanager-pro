
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, FileText, PenTool } from 'lucide-react';
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
    photo: '',
    cvUrl: '',
    signature: ''
  });

  useEffect(() => {
    if (coach) setFormData(coach);
  }, [coach]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'cvUrl' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(prev => ({ ...prev, [field]: ev.target?.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added missing updatedAt property to comply with Coach interface
    onSave({ 
      ...formData, 
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as Coach);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800">
            {coach ? 'Editar Entrenador' : 'Nuevo Entrenador'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-full aspect-square rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                {formData.photo ? (
                  <img src={formData.photo} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-slate-300" />
                )}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <label className="block text-center text-xs font-bold text-slate-500 uppercase">Fotografía</label>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <PenTool className="w-4 h-4" /> Firma Digital
                </p>
                {formData.signature ? (
                  <img src={formData.signature} className="h-16 mx-auto object-contain bg-white rounded" />
                ) : (
                  <div className="h-16 flex items-center justify-center text-xs text-slate-400">Sin firma</div>
                )}
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'signature')} className="mt-2 text-xs w-full" />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellidos</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría Asignada</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salario Base</label>
                <input type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Ingreso</label>
                <input required type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Retiro (Opcional)</label>
                <input type="date" value={formData.exitDate || ''} onChange={e => setFormData({...formData, exitDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hoja de Vida (PDF)</label>
                <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'cvUrl')} className="w-full text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Residencia</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" className="flex-[2] py-3 px-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Guardar Entrenador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachModal;
