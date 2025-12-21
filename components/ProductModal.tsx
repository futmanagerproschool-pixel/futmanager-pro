
import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Package, DollarSign, BarChart3 } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product;
}

const DEFAULT_FORM: Partial<Product> = {
  code: '',
  description: '',
  buyPrice: 0,
  sellPrice: 0,
  stock: 0,
  category: 'Uniformes'
};

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState<Partial<Product>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData(product);
      } else {
        setFormData(DEFAULT_FORM);
      }
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      updatedAt: Date.now()
    } as Product);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {product ? 'Editar Producto' : 'Nuevo Ingreso a Inventario'}
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestión de Activos y Stock Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Ref.</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/30 transition-all" placeholder="UNI-2024" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100">
                <option value="Uniformes">Uniformes</option>
                <option value="Implementos">Implementos</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Servicios">Servicios</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Producto</label>
            <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/30" placeholder="Ej: Uniforme Titular Oficial 2024" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Compra</label>
              <input required type="number" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Venta</label>
              <input required type="number" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-emerald-50 text-emerald-700 font-black rounded-2xl outline-none border border-emerald-100" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Inicial</label>
              <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen de Ganancia Estimado</p>
              <p className="text-2xl font-black italic text-emerald-500">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((formData.sellPrice || 0) - (formData.buyPrice || 0))}
              </p>
            </div>
            <button type="submit" className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20">
              <Save className="w-6 h-6" /> Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
