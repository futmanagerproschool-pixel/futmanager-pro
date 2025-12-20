
import React, { useState } from 'react';
import { X, Trophy, MapPin, Calendar, Clock, Users, Save, Printer } from 'lucide-react';
import { MatchCallup, Student } from '../types';
import { POSITIONS } from '../constants';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: MatchCallup) => void;
  students: Student[];
}

const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, onSave, students }) => {
  const [formData, setFormData] = useState<Partial<MatchCallup>>({
    tournament: '',
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    location: '',
    starters: [],
    substitutes: []
  });

  if (!isOpen) return null;

  const toggleStarter = (studentId: string) => {
    const isStarter = formData.starters?.some(s => s.studentId === studentId);
    if (isStarter) {
      setFormData({ ...formData, starters: formData.starters?.filter(s => s.studentId !== studentId) });
    } else {
      setFormData({ ...formData, starters: [...(formData.starters || []), { studentId, position: 'Delantero' }] });
    }
  };

  const toggleSub = (studentId: string) => {
    const isSub = formData.substitutes?.includes(studentId);
    if (isSub) {
      setFormData({ ...formData, substitutes: formData.substitutes?.filter(id => id !== studentId) });
    } else {
      setFormData({ ...formData, substitutes: [...(formData.substitutes || []), studentId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added missing updatedAt property to satisfy MatchCallup interface
    onSave({ 
      ...formData, 
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as MatchCallup);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" /> Nueva Convocatoria
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Datos del Encuentro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Torneo / Evento</label>
                <input required type="text" placeholder="Ej: Copa Departamental" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.tournament} onChange={e => setFormData({...formData, tournament: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Rival</label>
                <input required type="text" placeholder="Ej: Club Deportivo A" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.opponent} onChange={e => setFormData({...formData, opponent: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                  <input required type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Hora</label>
                  <input required type="time" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Lugar</label>
                <input required type="text" placeholder="Ej: Cancha Municipal 1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Crear Convocatoria
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users className="w-4 h-4" /> Selección de Plantilla
               </h3>
               <div className="flex gap-4 text-[10px] font-bold">
                 <span className="text-blue-600">Titulares: {formData.starters?.length}</span>
                 <span className="text-amber-600">Suplentes: {formData.substitutes?.length}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {students.map(student => {
                const isStarter = formData.starters?.find(s => s.studentId === student.id);
                const isSub = formData.substitutes?.includes(student.id);
                return (
                  <div key={student.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isStarter ? 'bg-blue-50 border-blue-200' : isSub ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{student.firstName[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{student.category} - {student.position}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => toggleStarter(student.id)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isStarter ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                        Titular
                      </button>
                      <button type="button" onClick={() => toggleSub(student.id)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isSub ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                        Suplente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchModal;
