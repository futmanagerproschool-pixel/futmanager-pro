
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Calculator } from 'lucide-react';
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
    school: '',
    grade: '',
    dob: '',
    position: 'Delantero',
    category: 'Sub-5',
    coachId: coaches[0]?.id || '',
    parents: { fatherName: '', motherName: '', phone: '', address: '' },
    observations: '',
    paymentStatus: 'UP_TO_DATE',
    entryDate: new Date().toISOString().split('T')[0]
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
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800">
            {student ? 'Editar Alumno' : 'Nuevo Alumno'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-48 h-48 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group relative cursor-pointer">
                {formData.photo ? (
                  <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Subir Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombres</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Apellidos</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Documento</label>
                <input required type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo Sangre</label>
                <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Health & Metrics */}
          <div className="bg-emerald-50 p-6 rounded-3xl">
            <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Métricas y Salud
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Peso (kg)</label>
                <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Talla (cm)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl outline-none" />
              </div>
              <div className="bg-emerald-100/50 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">IMC Calculado</span>
                <span className="text-lg font-bold text-emerald-800">{bmi}</span>
              </div>
              <div className="bg-emerald-100/50 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Estado</span>
                <span className="text-sm font-bold text-emerald-800 uppercase">{getBMIStatus(bmi)}</span>
              </div>
            </div>
          </div>

          {/* Education & Age */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Nacimiento</label>
                <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                <p className="mt-1 text-xs text-slate-400 font-medium">Edad: {age} años</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colegio</label>
                <input type="text" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
                <input type="text" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
          </div>

          {/* Sport Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Posición</label>
                <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Entrenador</label>
                <select value={formData.coachId} onChange={e => setFormData({...formData, coachId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
          </div>

          {/* Parents */}
          <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
             <h3 className="text-slate-800 font-bold">Información de Padres/Acudientes</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Nombre del Padre" type="text" value={formData.parents?.fatherName} onChange={e => setFormData({...formData, parents: {...formData.parents!, fatherName: e.target.value}})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
                <input placeholder="Nombre de la Madre" type="text" value={formData.parents?.motherName} onChange={e => setFormData({...formData, parents: {...formData.parents!, motherName: e.target.value}})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
                <input placeholder="Teléfono" type="text" value={formData.parents?.phone} onChange={e => setFormData({...formData, parents: {...formData.parents!, phone: e.target.value}})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
                <input placeholder="Dirección" type="text" value={formData.parents?.address} onChange={e => setFormData({...formData, parents: {...formData.parents!, address: e.target.value}})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
            <textarea rows={3} value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" className="flex-[2] py-3 px-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Guardar Alumno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
