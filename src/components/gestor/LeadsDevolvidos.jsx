import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';

export default function LeadsDevolvidos() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, hoje, semana
  const [stats, setStats] = useState({
    total: 0,
    hoje: 0,
    semana: 0,
    porTempo: 0,
    porLimite: 0
  });

  const carregarLeadsDevolvidos = useCallback(async () => {
    setLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      const q = query(
        leadsRef,
        where('status', '==', 'devolvido'),
        orderBy('data_devolucao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const leadsData = [];
      let totalLeads = 0;
      let leadsHoje = 0;
      let leadsSemana = 0;
      let porTempo = 0;
      let porLimite = 0;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const semanaPassada = new Date();
      semanaPassada.setDate(semanaPassada.getDate() - 7);
      semanaPassada.setHours(0, 0, 0, 0);

      querySnapshot.forEach((doc) => {
        const lead = { id: doc.id, ...doc.data() };
        const dataDevolucao = lead.data_devolucao?.toDate();
        
        if (dataDevolucao) {
          if (dataDevolucao >= hoje) {
            leadsHoje++;
          }
          if (dataDevolucao >= semanaPassada) {
            leadsSemana++;
          }
        }

        if (lead.motivo_devolucao === 'Tempo expirado') {
          porTempo++;
        } else if (lead.motivo_devolucao === 'Limite de alterações') {
          porLimite++;
        }
        
        leadsData.push(lead);
        totalLeads++;
      });

      // Filtra os leads com base no filtro selecionado
      const leadsFilter = leadsData.filter(lead => {
        const dataDevolucao = lead.data_devolucao?.toDate();
        if (!dataDevolucao) return false;
        
        switch (filtro) {
          case 'hoje':
            return dataDevolucao >= hoje;
          case 'semana':
            return dataDevolucao >= semanaPassada;
          default:
            return true;
        }
      });

      setLeads(leadsFilter);
      setStats({
        total: totalLeads,
        hoje: leadsHoje,
        semana: leadsSemana,
        porTempo,
        porLimite
      });
    } catch (error) {
      console.error('Erro ao carregar leads devolvidos:', error);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregarLeadsDevolvidos();
  }, [carregarLeadsDevolvidos]);

  const formatarTempo = (data) => {
    const agora = new Date();
    const diff = agora - data;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
    if (horas > 0) return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
    if (minutos > 0) return `${minutos} minuto${minutos > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const redistribuirLead = async (leadId) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: 'novo',
        corretor_id: null,
        data_devolucao: null,
        motivo_devolucao: null,
        status_changes: 0,
        ultima_interacao: Timestamp.now()
      });

      // Atualiza a lista removendo o lead redistribuído
      setLeads(leads.filter(lead => lead.id !== leadId));
      
      // Atualiza as estatísticas
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        hoje: prev.hoje - 1,
        semana: prev.semana - 1
      }));

      alert('Lead redistribuído com sucesso!');
    } catch (error) {
      console.error('Erro ao redistribuir lead:', error);
      alert('Erro ao redistribuir lead. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500 flex items-center">
          <ClockIcon className="animate-spin h-5 w-5 mr-2" />
          Carregando leads devolvidos...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads Devolvidos</h1>
        <p className="mt-2 text-gray-600">Gerencie os leads que foram devolvidos por tempo expirado ou limite de alterações</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardDocumentListIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devolvidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.hoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <ExclamationTriangleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Por Tempo</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.porTempo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <UserIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Por Limite</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.porLimite}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Histórico de Devoluções
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Visualize e gerencie os leads devolvidos
              </p>
            </div>
            <button
              onClick={carregarLeadsDevolvidos}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Atualizar lista"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filtro === 'todos'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFiltro('hoje')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filtro === 'hoje'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hoje ({stats.hoje})
              </button>
              <button
                onClick={() => setFiltro('semana')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filtro === 'semana'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Última Semana ({stats.semana})
              </button>
            </div>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lead devolvido</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há leads devolvidos no período selecionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-primary-200 transition-colors p-4 relative group"
              >
                {/* Indicador de tempo */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {formatarTempo(lead.data_devolucao?.toDate())}
                  </span>
                </div>

                {/* Cabeçalho do card */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate pr-20">
                    {lead.nome}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{lead.email}</p>
                </div>

                {/* Informações do lead */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>Corretor: {lead.ultimo_corretor_nome || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Distribuído: {lead.data_distribuicao?.toDate().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.motivo_devolucao === 'Tempo expirado'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {lead.motivo_devolucao}
                    </span>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="mt-4 flex justify-end space-x-2">
                  <button 
                    onClick={() => redistribuirLead(lead.id)}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Redistribuir
                    <ArrowPathRoundedSquareIcon className="h-4 w-4 ml-1" />
                  </button>
                  <button className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 font-medium">
                    Ver detalhes
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 