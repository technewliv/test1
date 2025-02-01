import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

export default function DashboardCorretor() {
  const [metricas, setMetricas] = useState({
    leadsAtivos: 0,
    atendimentosHoje: 0,
    taxaConversao: 0,
    mensagensNaoLidas: 0
  });

  // Carregar métricas
  useEffect(() => {
    const carregarMetricas = async () => {
      if (!auth.currentUser) return;

      try {
        // Leads Ativos
        const leadsQuery = query(
          collection(db, 'leads'),
          where('corretorId', '==', auth.currentUser.uid),
          where('status', '==', 'ativo')
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsAtivos = leadsSnapshot.size;

        // Atendimentos Hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const atendimentosQuery = query(
          collection(db, 'atendimentos'),
          where('corretorId', '==', auth.currentUser.uid),
          where('data', '>=', hoje)
        );
        const atendimentosSnapshot = await getDocs(atendimentosQuery);
        const atendimentosHoje = atendimentosSnapshot.size;

        // Taxa de Conversão
        const leadsFechadosQuery = query(
          collection(db, 'leads'),
          where('corretorId', '==', auth.currentUser.uid),
          where('status', '==', 'convertido')
        );
        const leadsFechadosSnapshot = await getDocs(leadsFechadosQuery);
        const totalLeadsQuery = query(
          collection(db, 'leads'),
          where('corretorId', '==', auth.currentUser.uid)
        );
        const totalLeadsSnapshot = await getDocs(totalLeadsQuery);
        
        const taxaConversao = totalLeadsSnapshot.size > 0
          ? Math.round((leadsFechadosSnapshot.size / totalLeadsSnapshot.size) * 100)
          : 0;

        // Mensagens não lidas
        const mensagensQuery = query(
          collection(db, 'mensagens'),
          where('destinatarioId', '==', auth.currentUser.uid),
          where('lida', '==', false)
        );
        const mensagensSnapshot = await getDocs(mensagensQuery);
        const mensagensNaoLidas = mensagensSnapshot.size;

        setMetricas({
          leadsAtivos,
          atendimentosHoje,
          taxaConversao,
          mensagensNaoLidas
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      }
    };

    carregarMetricas();
    // Atualizar métricas a cada 5 minutos
    const interval = setInterval(carregarMetricas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <h3 className="text-3xl font-bold text-gray-900 mb-8">
        Visão Geral
      </h3>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Leads Ativos */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Leads Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.leadsAtivos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Atendimentos Hoje */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhoneIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Atendimentos Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.atendimentosHoje}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Taxa de Conversão
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.taxaConversao}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens não lidas */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Mensagens não lidas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metricas.mensagensNaoLidas}
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