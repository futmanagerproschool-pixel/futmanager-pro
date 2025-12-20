
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
  ShoppingBag
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
    { id: 'store', label: 'Tienda Pro', icon: ShoppingBag, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'training', label: 'Entrenamientos', icon: ClipboardList, roles: ['ADMIN', 'COACH'] },
    { id: 'coaches', label: 'Entrenadores', icon: UserSquare2, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'matches', label: 'Partidos', icon: Trophy, roles: ['ADMIN', 'COACH'] },
    { id: 'financial', label: 'Finanzas & Caja', icon: Wallet, roles: ['ADMIN', 'SECRETARY'] },
    { id: 'reports', label: 'Informes AI', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'users', label: 'Usuarios', icon: UserPlus, roles: ['ADMIN'] },
    { id: 'backups', label: 'Seguridad', icon: Database, roles: ['ADMIN'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 flex flex-col items-center gap-3 border-b border-slate-800">
        {school.logo ? (
          <img src={school.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg" />
        ) : (
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="text-center overflow-hidden w-full">
          <h1 className="font-bold text-lg truncate tracking-tight">{school.name}</h1>
          <p className="text-[10px] text-slate-400 truncate italic">{school.slogan}</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-black">
            {currentUser.name[0]}
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="text-xs font-bold truncate">{currentUser.name}</p>
             <p className="text-[10px] text-slate-500 uppercase font-black">{currentUser.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
