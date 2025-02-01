import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';

export default function DistribuirLeads() {
  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [distribuindo, setDistribuindo] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar leads não distribuídos
      const leadsRef = collection(db, 'leads');
      const leadsQuery = query(
        leadsRef, 
        where('corretor_id', '==', null),
        orderBy('created_at', 'desc')
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsData);

      // 2. Carregar todos os usuários (exceto admins)
      const usuariosRef = collection(db, 'users');
      const usuariosSnapshot = await getDocs(usuariosRef);
      const usuariosData = [];
      
      usuariosSnapshot.forEach(doc => {
        const data = doc.data();
        // Se não for admin, adiciona à lista
        if (data.role !== 'admin') {
          usuariosData.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log('Usuários encontrados:', usuariosData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      }
      return [...prev, leadId];
    });
  };

  const handleSelectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleDistribuirLeads = async () => {
    if (!selectedUsuario || selectedLeads.length === 0) {
      alert('Selecione um usuário e pelo menos um lead para distribuir');
      return;
    }

    setDistribuindo(true);
    try {
      for (const leadId of selectedLeads) {
        const leadRef = doc(db, 'leads', leadId);
        await updateDoc(leadRef, {
          corretor_id: selectedUsuario,
          status: 'novo',
          distribuido_em: Timestamp.now(),
          ultima_interacao: Timestamp.now()
        });
      }

      alert('Leads distribuídos com sucesso!');
      setSelectedLeads([]);
      setSelectedUsuario('');
      carregarDados();
    } catch (error) {
      console.error('Erro ao distribuir leads:', error);
      alert('Erro ao distribuir leads. Tente novamente.');
    } finally {
      setDistribuindo(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Distribuir Leads</h1>
        <p className="mt-2 text-gray-600">Distribua leads para os usuários</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardDocumentListIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Leads Não Distribuídos</p>
              <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UserGroupIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuários Disponíveis</p>
              <p className="text-2xl font-semibold text-gray-900">{usuarios.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Distribuição */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Leads Disponíveis
            </h3>
            <p className="text-sm text-gray-500">
              Selecione os leads e escolha um usuário para distribuí-los
            </p>
          </div>
          <button
            onClick={carregarDados}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Atualizar lista"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Seleção de Usuário */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione um usuário</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.name || usuario.email} ({usuario.email})
                </option>
              ))}
            </select>

            <button
              onClick={handleDistribuirLeads}
              disabled={distribuindo || !selectedUsuario || selectedLeads.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {distribuindo ? 'Distribuindo...' : 'Distribuir Leads Selecionados'}
            </button>
          </div>

          {usuarios.length === 0 && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Não há usuários disponíveis no sistema.
              </p>
            </div>
          )}

          {/* Lista de Leads */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length}
                      onChange={handleSelectAllLeads}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interesse
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.nome}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-sm text-gray-500">{lead.telefone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.interesse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.created_at?.toDate ? new Date(lead.created_at.toDate()).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 