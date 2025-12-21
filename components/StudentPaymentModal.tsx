
import React, { useState, useMemo } from 'react';
import { X, Calendar, Wallet, CheckCircle2, DollarSign, Tag, Printer, Save } from 'lucide-react';
import { Student, PaymentMethod, MonthlyPaymentRecord } from '../types';
import { formatCurrency } from '../utils';

interface StudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (records: Omit<MonthlyPaymentRecord, 'id' | 'orderNumber'>[]) => void;
  baseAmount?: number;
}

const MONTHS_MAP = [
  { id: '01', name: 'Enero' }, { id: '02', name: 'Febrero' }, { id: '03', name: 'Marzo' },
  { id: '04', name: 'Abril' }, { id: '05', name: 'Mayo' }, { id: '06', name: 'Junio' },
  { id: '07', name: 'Julio' }, { id: '08', name: 'Agosto' }, { id: '09', name: 'Septiembre' },
  { id: '10', name: 'Octubre' }, { id: '11', name: 'Noviembre' }, { id: '12', name: 'Diciembre' }
];

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({ isOpen, onClose, student, onSave, baseAmount = 120000 }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState(0);

  if (!isOpen) return null;

  const toggleMonth = (monthId: string) => {
    const fullMonth = `${currentYear}-${monthId}`;
    if (student.paidMonths?.includes(fullMonth)) return;
    setSelectedMonths(prev => 
      prev.includes(fullMonth) ? prev.filter(m => m !== fullMonth) : [...prev, fullMonth]
    );
  };

  const totalToPay = (selectedMonths.length * baseAmount) - discount;

  const handleProcessPayment = () => {
    if (selectedMonths.length === 0) return alert("Selecciona al menos un mes.");
    
    const records = selectedMonths.map(month => ({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      month: month,
      baseAmount: baseAmount,
      discount: discount / selectedMonths.length,
      paidAmount: (baseAmount - (discount / selectedMonths.length)),
      paymentMethod: paymentMethod,
      date: new Date().toISOString().split('T')[0]
    }));

    onSave(records);
    onClose();
    setSelectedMonths([]);
    setDiscount(0);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 animate-in zoom-in-95">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recaudo de Mensualidad</h2>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">{student.firstName} {student.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Seleccionar Meses ({currentYear})
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {MONTHS_MAP.map(m => {
                const fullMonth = `${currentYear}-${m.id}`;
                const isPaid = student.paidMonths?.includes(fullMonth);
                const isSelected = selectedMonths.includes(fullMonth);
                return (
                  <button
                    key={m.id}
                    disabled={isPaid}
                    onClick={() => toggleMonth(m.id)}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2
                      ${isPaid ? 'bg-slate-100 border-transparent text-slate-300 cursor-not-allowed' : 
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 
                        'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
                  >
                    <span>{m.name}</span>
                    {isPaid && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {['CASH', 'NEQUI', 'DAVIPLATA', 'CARD'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m as any)}
                    className={`py-3 rounded-xl text-[9px] font-black border-2 transition-all ${paymentMethod === m ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-transparent text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descuento Global (Opcional)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none"
                  placeholder="Monto en pesos"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Resumen de Pago ({selectedMonths.length} meses)</p>
              <p className="text-3xl font-black italic">{formatCurrency(totalToPay)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-emerald-400 uppercase">Tarifa Base: {formatCurrency(baseAmount)}</p>
              <p className="text-[8px] font-black text-rose-400 uppercase">Descuento: {formatCurrency(discount)}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cerrar</button>
          <button 
            onClick={handleProcessPayment} 
            disabled={selectedMonths.length === 0}
            className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 disabled:opacity-30"
          >
            <Save className="w-5 h-5" /> Registrar y Generar Volante
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPaymentModal;
