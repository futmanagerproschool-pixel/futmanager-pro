
import React, { useState } from 'react';
import { X, BrainCircuit, Save, Sparkles, Trophy } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { generateTrainingPlan } from '../geminiService';
import { TrainingPlan } from '../types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: TrainingPlan) => void;
  coachId: string;
}

const TrainingModal: React.FC<TrainingModalProps> = ({ isOpen, onClose, onSave, coachId }) => {
  const [category, setCategory] = useState('Sub-11');
  const [objective, setObjective] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!objective) return alert('Por favor ingresa un objetivo');
    setIsGenerating(true);
    const plan = await generateTrainingPlan(category, objective);
    setContent(plan);
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!content) return alert('Genera un plan antes de guardar');
    // Added missing updatedAt property to comply with TrainingPlan interface
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      category,
      objective,
      content,
      date: new Date().toISOString().split('T')[0],
      coachId,
      updatedAt: Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Planificador Pro AI</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Genera entrenamientos con Inteligencia Artificial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X /></button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Categoría del Equipo</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Objetivo de la Sesión</label>
                  <textarea 
                    placeholder="Ej: Mejorar el control orientado y pases entre líneas..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20 h-32 resize-none"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                  />
               </div>
               <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
                >
                  {isGenerating ? 'IA Pensando...' : <><Sparkles className="w-6 h-6 text-amber-400" /> Generar Plan Mágico</>}
               </button>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 min-h-[400px] relative border-2 border-dashed border-slate-200">
               {!content && !isGenerating ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center space-y-4">
                    <Trophy className="w-16 h-16 opacity-20" />
                    <p className="font-bold text-sm max-w-[200px]">Tu plan personalizado aparecerá aquí después de que la IA lo analice.</p>
                 </div>
               ) : (
                 <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-wrap font-medium text-slate-600">
                    {content}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
           <button onClick={onClose} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-200 rounded-2xl transition-all">Cancelar</button>
           <button onClick={handleSave} className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2">
             <Save className="w-5 h-5" /> Guardar Plan
           </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;
