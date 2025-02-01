import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ShareIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function DashboardGestor() {
  const [metricas, setMetricas] = useState({
    totalLeadsCarregados: 0,
    leadsDisponiveis: 0,
    leadsEmAtendimento: 0,
    leadsFechados: 0
  });

  const [perfilGestor, setPerfilGestor] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataCadastro: null,
    totalCorretores: 0
  });

  // Carregar perfil do gestor
  useEffect(() => {
    const carregarPerfil = async () => {
      if (!auth.currentUser) return;

      try {
        // Buscar dados do gestor
        const gestorDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!gestorDoc.exists()) return;

        const gestorData = gestorDoc.data();

        // Contar total de corretores associados
        const corretoresQuery = query(
          collection(db, 'users'),
          where('gestorId', '==', auth.currentUser.uid),
          where('role', '==', 'corretor')
        );
        const corretoresSnapshot = await getDocs(corretoresQuery);

        setPerfilGestor({
          nome: gestorData.name || 'Nome não informado',
          email: gestorData.email || 'Email não informado',
          telefone: gestorData.telefone || 'Telefone não informado',
          dataCadastro: gestorData.dataCadastro?.toDate() || new Date(),
          totalCorretores: corretoresSnapshot.size
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    carregarPerfil();
  }, []);

  // Carregar métricas
  useEffect(() => {
    const carregarMetricas = async () => {
      if (!auth.currentUser) return;

      try {
        // Total de Leads Carregados (todos os leads carregados pelo gestor)
        const leadsCarregadosQuery = query(
          collection(db, 'leads'),
          where('gestorId', '==', auth.currentUser.uid),
          orderBy('dataCarregamento', 'desc')
        );
        const leadsCarregadosSnapshot = await getDocs(leadsCarregadosQuery);
        const totalLeadsCarregados = leadsCarregadosSnapshot.size;

        // Leads Disponíveis para Distribuição
        const leadsDisponiveisQuery = query(
          collection(db, 'leads'),
          where('gestorId', '==', auth.currentUser.uid),
          where('status', '==', 'pendente')
        );
        const leadsDisponiveisSnapshot = await getDocs(leadsDisponiveisQuery);
        const leadsDisponiveis = leadsDisponiveisSnapshot.size;

        // Leads em Atendimento
        const leadsAtendimentoQuery = query(
          collection(db, 'leads'),
          where('gestorId', '==', auth.currentUser.uid),
          where('status', '==', 'em_atendimento')
        );
        const leadsAtendimentoSnapshot = await getDocs(leadsAtendimentoQuery);
        const leadsEmAtendimento = leadsAtendimentoSnapshot.size;

        // Leads Fechados (Convertidos)
        const leadsFechadosQuery = query(
          collection(db, 'leads'),
          where('gestorId', '==', auth.currentUser.uid),
          where('status', '==', 'convertido')
        );
        const leadsFechadosSnapshot = await getDocs(leadsFechadosQuery);
        const leadsFechados = leadsFechadosSnapshot.size;

        setMetricas({
          totalLeadsCarregados,
          leadsDisponiveis,
          leadsEmAtendimento,
          leadsFechados
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      }
    };

    carregarMetricas();
    const interval = setInterval(carregarMetricas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Mini Perfil */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {perfilGestor.nome}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                {perfilGestor.email}
              </div>
              <div className="flex items-center text-gray-600">
                <PhoneIcon className="h-5 w-5 mr-2" />
                {perfilGestor.telefone}
              </div>
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Cadastrado em: {perfilGestor.dataCadastro?.toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                {perfilGestor.totalCorretores} corretores associados
              </div>
            </div>
          </div>
          <div className="bg-primary-100 rounded-full p-3">
            <UserIcon className="h-12 w-12 text-primary-600" />
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-bold text-gray-900 mb-8">
        Visão Geral
      </h3>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de Leads Carregados */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Leads Carregados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.totalLeadsCarregados}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Disponíveis */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShareIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Leads Disponíveis
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.leadsDisponiveis}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Leads em Atendimento */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Leads em Atendimento
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.leadsEmAtendimento}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Fechados */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Leads Fechados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.leadsFechados}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 