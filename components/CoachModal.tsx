
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, FileText, PenTool, Phone, MapPin, DollarSign, Calendar } from 'lucide-react';
import { Coach } from '../types';
import { CATEGORIES } from '../constants';

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coach: Coach) => void;
  coach?: Coach;
}

const DEFAULT_FORM: Partial<Coach> = {
  firstName: '',
  lastName: '',
  category: 'Sub-13',
  entryDate: new Date().toISOString().split('T')[0],
  phone: '',
  address: '',
  baseSalary: 0,
  photo: '',
  cvUrl: '',
  signature: '',
  exitDate: ''
};

const CoachModal: React.FC<CoachModalProps> = ({ isOpen, onClose, onSave, coach }) => {
  const [formData, setFormData] = useState<Partial<Coach>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      if (coach) {
        setFormData(coach);
      } else {
        setFormData(DEFAULT_FORM);
      }
    }
  }, [coach, isOpen]);

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
    onSave({ 
      ...formData, 
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as Coach);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {coach ? 'Gestionar Perfil Entrenador' : 'Vincular Nuevo Entrenador'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contratación y Registro Profesional</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Columna de Archivos */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotografía Profesional</label>
                <div className="w-full aspect-square rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                  {formData.photo ? (
                    <img src={formData.photo} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-12 h-12 text-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-500" /> Firma Digital
                </p>
                <div className="h-24 bg-white rounded-2xl border border-slate-200 flex items-center justify-center relative group overflow-hidden">
                  {formData.signature ? (
                    <img src={formData.signature} className="max-h-full object-contain p-2" />
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold">Subir Firma Escaneada</span>
                  )}
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'signature')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Curriculum Vitae (PDF)
                </p>
                <div className="relative">
                  <button type="button" className="w-full py-3 bg-white border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2">
                    {formData.cvUrl ? 'CV Cargado ✓' : 'Subir CV'}
                  </button>
                  <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'cvUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Columna de Datos */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría Asignada</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Salario Mensual (COP)</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input type="number" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value)})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Ingreso</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input required type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Retiro (Si aplica)</label>
                <input type="date" value={formData.exitDate || ''} onChange={e => setFormData({...formData, exitDate: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección de Domicilio</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase text-xs rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-[2] py-5 bg-emerald-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Guardar en Base de Datos Cloud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachModal;
