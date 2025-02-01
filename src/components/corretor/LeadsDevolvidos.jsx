import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export default function LeadsDevolvidos() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, hoje, semana
  const [stats, setStats] = useState({
    total: 0,
    hoje: 0,
    semana: 0
  });

  const carregarLeadsDevolvidos = async () => {
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
        semana: leadsSemana
      });
    } catch (error) {
      console.error('Erro ao carregar leads devolvidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLeadsDevolvidos();
  }, [filtro]);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Leads Devolvidos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Leads que foram devolvidos por tempo expirado ou limite de alterações
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

        {/* Filtros e Estatísticas */}
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

              {/* Botão de ação */}
              <div className="mt-4 flex justify-end">
                <button className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Ver detalhes
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 