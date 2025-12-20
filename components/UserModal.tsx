
import React, { useState } from 'react';
import { X, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'COACH',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: Math.random().toString(36).substr(2, 9)
    } as User);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vincular Usuario</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <div className="relative">
                   <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800" placeholder="Ej: Juan Marín" />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Institucional</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800" placeholder="usuario@escuela.com" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rol Asignado</label>
                   <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800">
                      <option value="ADMIN">Admin</option>
                      <option value="COACH">Entrenador</option>
                      <option value="SECRETARY">Secretaria</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PIN/Password</label>
                   <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 text-center tracking-[0.5em]" maxLength={6} />
                </div>
             </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
             <ShieldCheck className="w-5 h-5 text-emerald-600" />
             <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-tighter">Este usuario tendrá acceso inmediato a sus módulos asignados.</p>
          </div>

          <div className="flex gap-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
             <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100">Crear Acceso</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
