
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Activity, GraduationCap, Phone, MapPin, Calendar, Heart, Plus, Trophy } from 'lucide-react';
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

const DEFAULT_FORM: Partial<Student> = {
  firstName: '',
  lastName: '',
  document: '',
  bloodType: 'O+' as BloodType,
  weight: 0,
  height: 0,
  school: '',
  grade: '',
  dob: '',
  photo: '',
  position: 'Mediocentro',
  category: 'Sub-11',
  coachId: '',
  parents: { fatherName: '', motherName: '', phone: '', address: '' },
  observations: '',
  paymentStatus: 'UP_TO_DATE',
  status: 'ACTIVE',
  entryDate: new Date().toISOString().split('T')[0],
  paidMonths: []
};

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, student, coaches }) => {
  const [formData, setFormData] = useState<Partial<Student>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      if (student) {
        setFormData({
          ...DEFAULT_FORM,
          ...student,
          parents: { ...DEFAULT_FORM.parents, ...(student.parents || {}) }
        });
      } else {
        setFormData({ 
          ...DEFAULT_FORM, 
          coachId: coaches[0]?.id || '',
          entryDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [student, isOpen, coaches]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, photo: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const bmi = calculateBMI(formData.weight || 0, formData.height || 0);
  const bmiStatus = getBMIStatus(bmi);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.document) {
      return alert("Por favor completa los datos básicos (Nombres, Apellidos y Documento).");
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = formData.paidMonths || [];
    const isPaidCurrentMonth = months.includes(currentMonth);

    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now(),
      paidMonths: months,
      paymentStatus: isPaidCurrentMonth ? 'UP_TO_DATE' : 'IN_ARREARS', // Lógica automática
      status: formData.status || 'ACTIVE'
    } as Student);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {student ? 'Expediente del Alumno' : 'Nueva Ficha de Inscripción'}
            </h2>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">Gestión Centralizada Pro</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Lateral: Foto y Salud */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotografía de Identidad</label>
                <div className="w-full aspect-square rounded-[3rem] bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                  {formData.photo ? (
                    <img src={formData.photo} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-12 h-12 text-slate-300" />
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                     <Plus className="text-white w-10 h-10" />
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100 space-y-6">
                <div className="flex items-center gap-3 text-emerald-700 font-black text-xs uppercase tracking-widest"><Activity className="w-4 h-4" /> Diagnóstico Médico</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-emerald-600/50 uppercase block mb-1">Peso Actual (kg)</label>
                    <input type="number" step="0.1" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full p-4 bg-white rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-emerald-600/50 uppercase block mb-1">Estatura (cm)</label>
                    <input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: parseInt(e.target.value)})} className="w-full p-4 bg-white rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                   <div className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm">
                      <p className="text-xl font-black italic text-emerald-700">IMC {bmi > 0 ? bmi : '--'}</p>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${bmi > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {bmi > 0 ? bmiStatus : 'Sin datos'}
                      </span>
                   </div>
                   <div className="flex gap-2">
                      <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})} className="flex-1 p-3 bg-white rounded-xl text-[10px] font-black border-none shadow-sm">
                         {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => <option key={bt} value={bt}>RH: {bt}</option>)}
                      </select>
                   </div>
                </div>
              </div>
            </div>

            {/* Contenido: Datos Personales y Deportivos */}
            <div className="lg:col-span-8 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4"><Activity className="w-5 h-5 text-slate-300" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Información de Identidad</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nombres</label><input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Apellidos</label><input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Identificación (TI/RC/CC)</label><input required value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/20 transition-all" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fecha de Nacimiento</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" /></div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4"><Trophy className="w-5 h-5 text-slate-300" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Perfil Deportivo Institucional</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Categoría</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Posición</label><select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold">{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Entrenador Responsable</label><select value={formData.coachId} onChange={e => setFormData({...formData, coachId: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold">{coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4"><GraduationCap className="w-5 h-5 text-slate-300" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Entorno Familiar y Académico</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4">
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Ubicación y Contacto</p>
                     <input placeholder="Teléfono Acudiente" value={formData.parents?.phone} onChange={e => setFormData({...formData, parents: {...formData.parents!, phone: e.target.value}})} className="w-full p-4 bg-white rounded-xl text-sm font-bold shadow-sm" />
                     <input placeholder="Dirección Residencia" value={formData.parents?.address} onChange={e => setFormData({...formData, parents: {...formData.parents!, address: e.target.value}})} className="w-full p-4 bg-white rounded-xl text-sm font-bold shadow-sm" />
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4">
                     <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Nombres Padres</p>
                     <input placeholder="Nombre del Padre" value={formData.parents?.fatherName} onChange={e => setFormData({...formData, parents: {...formData.parents!, fatherName: e.target.value}})} className="w-full p-4 bg-white rounded-xl text-sm font-bold shadow-sm" />
                     <input placeholder="Nombre de la Madre" value={formData.parents?.motherName} onChange={e => setFormData({...formData, parents: {...formData.parents!, motherName: e.target.value}})} className="w-full p-4 bg-white rounded-xl text-sm font-bold shadow-sm" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones Especiales / Alergias</label>
                <textarea 
                   value={formData.observations} 
                   onChange={e => setFormData({...formData, observations: e.target.value})} 
                   className="w-full p-6 bg-slate-50 rounded-3xl font-medium text-slate-600 h-32 outline-none border-2 border-transparent focus:border-emerald-500/20" 
                   placeholder="Escriba aquí condiciones médicas, comportamientos o notas de interés..."
                />
              </section>
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-[2] py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-200 uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
               <Save className="w-5 h-5" /> Sincronizar Ficha Cloud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
