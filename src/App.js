import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardGestor from './components/DashboardGestor';
import DashboardCorretor from './components/DashboardCorretor';
import CreateAdmin from './components/CreateAdmin';
import Leads from './components/gestor/Leads';
import LeadsDevolvidos from './components/gestor/LeadsDevolvidos';
import GerenciarCorretores from './components/GerenciarCorretores';
import GestorLayout from './components/layouts/GestorLayout';
import CorretorLayout from './components/layouts/CorretorLayout';
import MeusLeads from './components/corretor/MeusLeads';
import Agenda from './components/corretor/Agenda';
import { auth } from './firebase';

function PrivateGestorRoute({ children }) {
  const user = auth.currentUser;
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <GestorLayout>
      {children}
    </GestorLayout>
  );
}

function PrivateCorretorRoute({ children }) {
  const user = auth.currentUser;
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <CorretorLayout>
      {children}
    </CorretorLayout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-admin" element={<CreateAdmin />} />
        
        {/* Rotas do Gestor */}
        <Route
          path="/dashboard-gestor"
          element={
            <PrivateGestorRoute>
              <DashboardGestor />
            </PrivateGestorRoute>
          }
        />
        <Route
          path="/dashboard-gestor/leads"
          element={
            <PrivateGestorRoute>
              <Leads />
            </PrivateGestorRoute>
          }
        />
        <Route
          path="/dashboard-gestor/leads-devolvidos"
          element={
            <PrivateGestorRoute>
              <LeadsDevolvidos />
            </PrivateGestorRoute>
          }
        />
        <Route
          path="/dashboard-gestor/corretores"
          element={
            <PrivateGestorRoute>
              <GerenciarCorretores />
            </PrivateGestorRoute>
          }
        />

        {/* Rotas do Corretor */}
        <Route
          path="/dashboard-corretor"
          element={
            <PrivateCorretorRoute>
              <DashboardCorretor />
            </PrivateCorretorRoute>
          }
        />
        <Route
          path="/dashboard-corretor/leads"
          element={
            <PrivateCorretorRoute>
              <MeusLeads />
            </PrivateCorretorRoute>
          }
        />
        <Route
          path="/dashboard-corretor/atendimentos"
          element={
            <PrivateCorretorRoute>
              <div>Atendimentos</div>
            </PrivateCorretorRoute>
          }
        />
        <Route
          path="/dashboard-corretor/agenda"
          element={
            <PrivateCorretorRoute>
              <Agenda />
            </PrivateCorretorRoute>
          }
        />
        <Route
          path="/dashboard-corretor/documentos"
          element={
            <PrivateCorretorRoute>
              <div>Documentos</div>
            </PrivateCorretorRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 