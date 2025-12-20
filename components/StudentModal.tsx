
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Calculator, Star, CreditCard } from 'lucide-react';
import { Student, BloodType } from '../types';
import { CATEGORIES, POSITIONS } from '../constants';
import { calculateBMI, calculateAge, getBMIStatus } from '../utils';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  student?: Student;
  coaches: { id: string, name: string }[];
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, student, coaches }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    document: '',
    bloodType: 'O+' as BloodType,
    weight: 0,
    height: 0,
    dob: '',
    position: 'Delantero',
    category: 'Sub-5',
    coachId: coaches[0]?.id || '',
    parents: { phone: '', address: '' },
    paymentStatus: 'UP_TO_DATE',
    loyaltyPoints: 0,
    creditDebt: 0
  });

  useEffect(() => {
    if (student) setFormData(student);
  }, [student]);

  if (!isOpen) return null;

  const bmi = calculateBMI(formData.weight || 0, formData.height || 0);
  const age = calculateAge(formData.dob || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Student);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {student ? 'Expediente del Alumno' : 'Registrar Nuevo Talento'}
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 flex flex-col items-center space-y-6">
              <div className="w-full aspect-square rounded-[3rem] bg-slate-100 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group relative cursor-pointer hover:border-emerald-400 transition-all">
                {formData.photo ? (
                  <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Subir Retrato</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-emerald-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="w-full space-y-3">
                 <div className="bg-amber-50 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><Star className="text-amber-500 w-5 h-5" /><span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Puntos Fidelidad</span></div>
                    <span className="text-2xl font-black text-amber-600">{formData.loyaltyPoints}</span>
                 </div>
                 <div className="bg-rose-50 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><CreditCard className="text-rose-500 w-5 h-5" /><span className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Saldo Pendiente</span></div>
                    <span className="text-2xl font-black text-rose-600">{formData.creditDebt}</span>
                 </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombres</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Apellidos</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identificación</label>
                    <input required type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grupo Sanguíneo</label>
                    <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
               </div>

               <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                  <h3 className="text-emerald-800 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-3"><Calculator className="w-5 h-5" /> Análisis Biomédico</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600/60 uppercase mb-2">Peso (kg)</label>
                      <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full px-5 py-3 bg-white border-none rounded-xl outline-none font-black text-emerald-900" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600/60 uppercase mb-2">Talla (cm)</label>
                      <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-white border-none rounded-xl outline-none font-black text-emerald-900" />
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl flex flex-col justify-center border border-emerald-100">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">IMC</span>
                      <span className="text-xl font-black text-emerald-900 tracking-tighter">{bmi}</span>
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl flex flex-col justify-center border border-emerald-100">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Diagnóstico</span>
                      <span className="text-[10px] font-black text-emerald-900 uppercase">{getBMIStatus(bmi)}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-100">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Perfil Deportivo</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Posición Natural</label>
                    <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-800">
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Categoría</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-800">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Contacto de Acudientes</h4>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Teléfono Urgencias</label>
                    <input type="text" value={formData.parents?.phone} onChange={e => setFormData({...formData, parents: {...formData.parents!, phone: e.target.value}})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-800" />
                   </div>
                   <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Residencia</label>
                    <input type="text" value={formData.parents?.address} onChange={e => setFormData({...formData, parents: {...formData.parents!, address: e.target.value}})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-800" />
                   </div>
                   <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Fecha Nacimiento</label>
                    <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-800" />
                    <p className="mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">EDAD ACTUAL: {age} AÑOS</p>
                   </div>
                </div>
              </div>
          </div>

          <div className="flex gap-6 pt-10 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Descartar</button>
            <button type="submit" className="flex-[3] py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
              <Save className="w-6 h-6" /> Actualizar Expediente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
