import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const STATUS_OPTIONS = [
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'sem_contato', label: 'Sem Contato' },
  { value: 'lead_errado', label: 'Lead Errado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'contrato_aprovado', label: 'Contrato Aprovado' }
];

export default function MeusLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    emAtendimento: 0,
    convertidos: 0,
    perdidos: 0
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!auth.currentUser) return;

      try {
        const leadsRef = collection(db, 'leads');
        const q = query(leadsRef, where('corretor_id', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const leadsData = [];
        let totalLeads = 0;
        let emAtendimento = 0;
        let convertidos = 0;
        let perdidos = 0;

        const now = new Date();
        
        querySnapshot.forEach((doc) => {
          const lead = { id: doc.id, ...doc.data() };
          
          // Verifica se o lead expirou (6 horas)
          const dataDistribuicao = lead.data_distribuicao?.toDate();
          if (dataDistribuicao) {
            const horasPassadas = (now - dataDistribuicao) / (1000 * 60 * 60);
            if (horasPassadas > 6 && lead.status_changes < 2) {
              // Devolve o lead para o gestor
              devolverLead(doc.id);
              return;
            }
          }
          
          leadsData.push(lead);
          
          totalLeads++;
          switch (lead.status) {
            case 'em_atendimento':
              emAtendimento++;
              break;
            case 'contrato_aprovado':
              convertidos++;
              break;
            case 'recusado':
            case 'lead_errado':
              perdidos++;
              break;
            default:
              // Leads com status não mapeado são contabilizados apenas no total
              break;
          }
        });

        setLeads(leadsData);
        setStats({
          total: totalLeads,
          emAtendimento,
          convertidos,
          perdidos
        });
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
    
    // Verifica leads expirados a cada minuto
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, []);

  const devolverLead = async (leadId) => {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        corretor_id: null,
        status: 'devolvido',
        data_devolucao: Timestamp.now(),
        motivo_devolucao: 'Tempo expirado'
      });
    } catch (error) {
      console.error('Erro ao devolver lead:', error);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedLead || !selectedStatus) return;

    try {
      const leadRef = doc(db, 'leads', selectedLead.id);
      
      // Verifica se já atingiu o limite de alterações
      if (selectedLead.status_changes >= 2) {
        alert('Este lead já atingiu o limite de alterações de status.');
        return;
      }

      await updateDoc(leadRef, {
        status: selectedStatus,
        status_changes: (selectedLead.status_changes || 0) + 1,
        ultima_interacao: Timestamp.now(),
        historico_status: [
          ...(selectedLead.historico_status || []),
          {
            status: selectedStatus,
            data: Timestamp.now(),
            corretor_id: auth.currentUser.uid
          }
        ]
      });

      // Atualiza a lista de leads
      const updatedLeads = leads.map(lead => {
        if (lead.id === selectedLead.id) {
          return {
            ...lead,
            status: selectedStatus,
            status_changes: (lead.status_changes || 0) + 1,
            ultima_interacao: Timestamp.now()
          };
        }
        return lead;
      });

      setLeads(updatedLeads);
      setShowStatusModal(false);
      setSelectedLead(null);
      setSelectedStatus('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do lead. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'em_atendimento':
        return 'bg-yellow-100 text-yellow-800';
      case 'contrato_aprovado':
        return 'bg-green-100 text-green-800';
      case 'recusado':
      case 'lead_errado':
        return 'bg-red-100 text-red-800';
      case 'sem_contato':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTempoRestante = (dataDistribuicao) => {
    if (!dataDistribuicao) return null;
    
    const agora = new Date();
    const distribuicao = dataDistribuicao.toDate();
    const tempoPassado = (agora - distribuicao) / (1000 * 60); // em minutos
    const tempoRestante = 360 - tempoPassado; // 6 horas em minutos
    
    if (tempoRestante <= 0) return 'Expirado';
    
    const horas = Math.floor(tempoRestante / 60);
    const minutos = Math.floor(tempoRestante % 60);
    
    if (horas > 0) {
      return `${horas}h${minutos}m`;
    }
    return `${minutos}m`;
  };

  const getTempoRestanteColor = (dataDistribuicao) => {
    if (!dataDistribuicao) return 'text-gray-500';
    
    const agora = new Date();
    const distribuicao = dataDistribuicao.toDate();
    const tempoPassado = (agora - distribuicao) / (1000 * 60); // em minutos
    const tempoRestante = 360 - tempoPassado; // 6 horas em minutos
    
    if (tempoRestante <= 0) return 'text-red-600';
    if (tempoRestante <= 60) return 'text-red-500'; // última hora
    if (tempoRestante <= 120) return 'text-yellow-500'; // últimas 2 horas
    return 'text-green-500';
  };

  const openDetailsModal = (lead) => {
    setSelectedDetailLead(lead);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meus Leads</h1>
        <p className="mt-2 text-gray-600">Gerencie seus leads ativos</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardDocumentListIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <PhoneIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Em Atendimento</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.emAtendimento}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Convertidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.convertidos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Perdidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.perdidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alteração de Status */}
      {showStatusModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Alterar Status do Lead</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedLead(null);
                  setSelectedStatus('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Lead: {selectedLead.nome}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Alterações restantes: {2 - (selectedLead.status_changes || 0)}
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Selecione um status</option>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedLead(null);
                    setSelectedStatus('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangeStatus}
                  disabled={!selectedStatus}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Leads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Leads Ativos
          </h3>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-6 text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lead encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aguarde a distribuição de leads pelo seu gestor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 mb-1">{lead.nome}</div>
                        <div className="flex items-center space-x-2">
                          {/* WhatsApp */}
                          {lead.telefone && (
                            <a
                              href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-green-600 hover:text-green-700"
                              title="Enviar WhatsApp"
                            >
                              <ChatBubbleLeftIcon className="h-4 w-4" />
                            </a>
                          )}
                          
                          {/* Telefone */}
                          {lead.telefone && (
                            <a
                              href={`tel:${lead.telefone}`}
                              className="inline-flex items-center text-blue-600 hover:text-blue-700"
                              title="Ligar"
                            >
                              <PhoneIcon className="h-4 w-4" />
                            </a>
                          )}
                          
                          {/* Email */}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center text-gray-600 hover:text-gray-700"
                              title="Enviar E-mail"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        {/* Indicador de tempo restante */}
                        <div className={`text-xs font-medium mt-1 flex items-center ${getTempoRestanteColor(lead.data_distribuicao)}`}>
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {getTempoRestante(lead.data_distribuicao)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status || 'novo')}`}>
                          {(lead.status || 'novo').replace('_', ' ').charAt(0).toUpperCase() + (lead.status || 'novo').slice(1)}
                        </span>
                        {lead.status_changes > 0 && (
                          <span className="text-xs text-gray-500">
                            ({2 - lead.status_changes} alterações restantes)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (lead.status_changes >= 2) {
                              alert('Este lead já atingiu o limite de alterações de status.');
                              return;
                            }
                            setSelectedLead(lead);
                            setShowStatusModal(true);
                          }}
                          className={`text-primary-600 hover:text-primary-900 disabled:text-gray-400 disabled:hover:text-gray-400 ${
                            lead.status_changes >= 2 ? 'cursor-not-allowed' : ''
                          }`}
                          disabled={lead.status_changes >= 2}
                        >
                          Alterar Status
                        </button>
                        <button
                          onClick={() => openDetailsModal(lead)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver detalhes"
                        >
                          <InformationCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Lead */}
      {showDetailsModal && selectedDetailLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 transform transition-all">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">{selectedDetailLead.nome}</h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedDetailLead.status || 'novo')}`}>
                  {(selectedDetailLead.status || 'novo').replace('_', ' ').charAt(0).toUpperCase() + (selectedDetailLead.status || 'novo').slice(1)}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDetailLead(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="space-y-4">
              {/* Contato e Tempo */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  {selectedDetailLead.telefone && (
                    <>
                      <a
                        href={`https://wa.me/55${selectedDetailLead.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                        title="WhatsApp"
                      >
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                      </a>
                      <a
                        href={`tel:${selectedDetailLead.telefone}`}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        title="Ligar"
                      >
                        <PhoneIcon className="h-5 w-5" />
                      </a>
                    </>
                  )}
                  {selectedDetailLead.email && (
                    <a
                      href={`mailto:${selectedDetailLead.email}`}
                      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
                      title="Email"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
                <div className={`flex items-center text-sm font-medium ${getTempoRestanteColor(selectedDetailLead.data_distribuicao)}`}>
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {getTempoRestante(selectedDetailLead.data_distribuicao)}
                </div>
              </div>

              {/* Informações do Lead */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {selectedDetailLead.email && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 truncate">{selectedDetailLead.email}</p>
                  </div>
                )}
                {selectedDetailLead.telefone && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Telefone</p>
                    <p className="text-sm text-gray-900">{selectedDetailLead.telefone}</p>
                  </div>
                )}
                {selectedDetailLead.possui_cnpj && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">CNPJ</p>
                    <p className="text-sm text-gray-900">{selectedDetailLead.possui_cnpj}</p>
                  </div>
                )}
                {selectedDetailLead.idades && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Idades</p>
                    <p className="text-sm text-gray-900">{selectedDetailLead.idades}</p>
                  </div>
                )}
                {selectedDetailLead.profissao && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Profissão</p>
                    <p className="text-sm text-gray-900">{selectedDetailLead.profissao}</p>
                  </div>
                )}
                {selectedDetailLead.plano_atual && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Plano Atual</p>
                    <p className="text-sm text-gray-900">{selectedDetailLead.plano_atual}</p>
                  </div>
                )}
              </div>

              {/* Status e Alterações */}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Última interação: {selectedDetailLead.ultima_interacao?.toDate().toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedDetailLead.status_changes || 0} de 2 alterações realizadas
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 