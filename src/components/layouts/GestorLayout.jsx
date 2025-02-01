import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function GestorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { name: 'Visão Geral', path: '/dashboard-gestor', icon: ChartBarIcon },
    { name: 'Leads', path: '/dashboard-gestor/leads', icon: ClipboardDocumentListIcon },
    { name: 'Leads Devolvidos', path: '/dashboard-gestor/leads-devolvidos', icon: ClockIcon },
    { name: 'Gerenciar Corretores', path: '/dashboard-gestor/corretores', icon: UserGroupIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-gradient-to-b from-primary-600 to-primary-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-200 ease-in-out md:relative md:translate-x-0 shadow-xl`}>
        <div className="flex flex-col h-full">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold px-4">NewLiv</h2>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
                      location.pathname === item.path
                        ? 'bg-white bg-opacity-10 text-white'
                        : 'text-white hover:bg-white hover:bg-opacity-5'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 text-white hover:bg-white hover:bg-opacity-5 w-full mt-8"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 