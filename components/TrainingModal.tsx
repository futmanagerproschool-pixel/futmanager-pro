
import React, { useState } from 'react';
import { X, BrainCircuit, Save, Sparkles, Trophy, Loader2 } from 'lucide-react';
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
    if (!objective.trim()) return alert('Por favor ingresa un objetivo para que la IA pueda trabajar.');
    setIsGenerating(true);
    try {
      const plan = await generateTrainingPlan(category, objective);
      setContent(plan);
    } catch (err) {
      alert("Error conectando con Gemini Pro. Revisa tu API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!content) return alert('Genera un plan antes de guardar');
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      category,
      objective,
      content,
      date: new Date().toISOString().split('T')[0],
      coachId,
      updatedAt: Date.now()
    });
    // Limpiar para la próxima vez
    setContent('');
    setObjective('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 text-white rounded-[1.8rem] shadow-xl shadow-indigo-100">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Planificador Metodológico Pro AI</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Inteligencia Artificial aplicada al Fútbol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
               <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración de Categoría</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] font-black text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-indigo-500/30 transition-all"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               
               <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo Táctico / Técnico</label>
                  <textarea 
                    placeholder="Ej: Trabajar la transición defensa-ataque y la finalización por bandas..."
                    className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-bold text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-indigo-500/30 h-40 resize-none transition-all"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                  />
               </div>

               <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !objective.trim()}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all disabled:opacity-50 shadow-2xl shadow-slate-200 group"
                >
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" /> 
                      Generar Plan con Gemini Pro
                    </>
                  )}
               </button>
            </div>

            <div className="lg:col-span-7 bg-slate-50 rounded-[3rem] p-10 min-h-[500px] relative border-2 border-dashed border-slate-200 overflow-hidden">
               {isGenerating && (
                 <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                    <p className="font-black text-slate-500 text-xs uppercase tracking-widest animate-pulse">Analizando metodología deportiva...</p>
                 </div>
               )}

               {!content && !isGenerating ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center space-y-6">
                    <div className="p-8 bg-white rounded-[3rem] shadow-inner">
                      <Trophy className="w-16 h-16 opacity-10" />
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-widest max-w-[250px] leading-relaxed">
                      El plan maestro aparecerá aquí. Define un objetivo y deja que la IA estructure tu entrenamiento.
                    </p>
                 </div>
               ) : (
                 <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-wrap font-bold text-slate-600 h-full overflow-y-auto scrollbar-hide pr-4">
                    {content}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
           <button onClick={onClose} className="px-10 py-5 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-all">Cancelar</button>
           <button onClick={handleSave} className="px-14 py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3">
             <Save className="w-6 h-6" /> Guardar Sesión
           </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;
