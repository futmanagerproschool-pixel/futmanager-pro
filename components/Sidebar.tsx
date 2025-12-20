
import React from 'react';
import { 
  Users, 
  UserSquare2, 
  Wallet, 
  BarChart3, 
  Database, 
  Trophy, 
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Settings,
  ClipboardList,
  UserPlus,
  ShoppingBag,
  Target
} from 'lucide-react';
import { SchoolInfo, User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  school: SchoolInfo;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, school, currentUser, onLogout }) => {
  const allItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'COACH', 'SECRETARY'] },
    { id: 'students', label: 'Alumnos', icon: Users, roles: ['ADMIN', 'COACH', 'SECRETARY'] },
    { id: 'store', label: 'Tienda & POS', icon: ShoppingBag, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'training', label: 'Entrenamientos', icon: ClipboardList, roles: ['ADMIN', 'COACH'] },
    { id: 'coaches', label: 'Staff Técnico', icon: UserSquare2, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'matches', label: 'Convocatorias', icon: Trophy, roles: ['ADMIN', 'COACH'] },
    { id: 'financial', label: 'Contabilidad', icon: Wallet, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'reports', label: 'Auditoría IA', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'users', label: 'Usuarios', icon: UserPlus, roles: ['ADMIN'] },
    { id: 'backups', label: 'Resguardos', icon: Database, roles: ['ADMIN'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-8 flex flex-col items-center gap-4 border-b border-slate-800">
        <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 rotate-3">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div className="text-center overflow-hidden w-full">
          <h1 className="font-black text-lg truncate tracking-tighter uppercase">{school.name}</h1>
          <p className="text-[9px] text-emerald-400 truncate font-black uppercase tracking-widest">{school.slogan}</p>
        </div>
      </div>

      <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                : 'text-slate-500 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-black text-[11px] uppercase tracking-wider">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-black shadow-inner">
            {currentUser.name[0]}
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="text-[10px] font-black truncate text-white uppercase">{currentUser.name}</p>
             <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">{currentUser.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3 text-slate-500 hover:text-rose-400 transition-colors font-black text-[10px] uppercase tracking-widest">
          <LogOut className="w-5 h-5" />
          <span>Finalizar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
