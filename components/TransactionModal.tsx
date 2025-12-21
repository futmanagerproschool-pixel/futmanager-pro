
import React, { useState } from 'react';
import { X, Save, TrendingUp, TrendingDown, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { Transaction, PaymentMethod } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'orderNumber' | 'updatedAt'>) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: 'MONTHLY_PAYMENT' as any,
    amount: 0,
    description: '',
    paymentMethod: 'CASH' as PaymentMethod,
    date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert("Monto inválido");
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 uppercase">Registrar Movimiento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            {['INCOME', 'EXPENSE'].map((t) => (
              <button 
                key={t}
                type="button" 
                onClick={() => setFormData({...formData, type: t as any})}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${formData.type === t ? (t === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'text-slate-400'}`}
              >
                {t === 'INCOME' ? 'Ingreso' : 'Egreso'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Efectivo' },
                  { id: 'NEQUI', label: 'Nequi' },
                  { id: 'DAVIPLATA', label: 'Daviplata' },
                  { id: 'CARD', label: 'Tarjeta' },
                  { id: 'TRANSFER', label: 'Transf.' },
                  { id: 'CREDIT', label: 'Crédito' },
                  { id: 'OTHER', label: 'Otro' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: m.id as any})}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.paymentMethod === m.id ? 'border-emerald-50 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Monto</label>
              <input required type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Descripción</label>
              <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="Ej: Pago Juan Perez Sub-11" />
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all">
            Confirmar en Firebase
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
