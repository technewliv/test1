import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, writeBatch, doc, query, getDocs, orderBy, where, getDoc, Timestamp } from 'firebase/firestore';
import { CloudArrowUpIcon, XCircleIcon, CheckCircleIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const COLUNAS_PERMITIDAS = [
  'NOME',
  'POSSUI CNPJ',
  'TELEFONE',
  'EMAIL',
  'IDADES',
  'PROFISSAO',
  'PLANO ATUAL',
  'STATUS'
];

export default function Leads() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDistribuirModal, setShowDistribuirModal] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [selectedCorretor, setSelectedCorretor] = useState('');
  const [stats, setStats] = useState({
    naoDistribuidos: 0,
    distribuidos: 0
  });

  // Função para carregar os leads
  const carregarLeads = async () => {
    setLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      // Modificado para buscar apenas leads não distribuídos
      const q = query(
        leadsRef,
        where('corretor_id', '==', null),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setLeads(leadsData);
      setStats({
        naoDistribuidos: leadsData.length,
        distribuidos: 0
      });

    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar os corretores
  const carregarCorretores = async () => {
    try {
      const corretoresRef = collection(db, 'users');
      const q = query(corretoresRef, where('role', '==', 'corretor'));
      const snapshot = await getDocs(q);
      
      const corretoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCorretores(corretoresData);
    } catch (error) {
      console.error('Erro ao carregar corretores:', error);
    }
  };

  // Carrega os leads ao montar o componente
  useEffect(() => {
    carregarLeads();
    carregarCorretores();
  }, []);

  // Função para distribuir leads
  const distribuirLeads = async () => {
    if (!selectedCorretor || selectedLeads.length === 0) return;

    try {
      setLoading(true);
      const leadsRef = collection(db, 'leads');
      
      // Primeiro, verifica se todos os leads selecionados ainda existem e não estão distribuídos
      const leadsExistentes = [];
      const leadsInexistentes = [];
      const leadsJaDistribuidos = [];
      
      for (const leadId of selectedLeads) {
        const leadDoc = await getDoc(doc(leadsRef, leadId));
        if (!leadDoc.exists()) {
          leadsInexistentes.push(leadId);
        } else if (leadDoc.data().corretor_id) {
          leadsJaDistribuidos.push(leadId);
        } else {
          leadsExistentes.push(leadId);
        }
      }

      // Notifica sobre leads inexistentes ou já distribuídos
      if (leadsInexistentes.length > 0 || leadsJaDistribuidos.length > 0) {
        let mensagem = '';
        if (leadsInexistentes.length > 0) {
          mensagem += `${leadsInexistentes.length} lead(s) não existe(m) mais no sistema.\n`;
        }
        if (leadsJaDistribuidos.length > 0) {
          mensagem += `${leadsJaDistribuidos.length} lead(s) já foi(ram) distribuído(s) para outro corretor.\n`;
        }
        alert(mensagem + 'A lista será atualizada.');
        
        if (leadsExistentes.length === 0) {
          await carregarLeads();
          setShowDistribuirModal(false);
          setLoading(false);
          return;
        }
      }

      // Procede com a distribuição dos leads existentes e não distribuídos
      const batch = writeBatch(db);

      leadsExistentes.forEach(leadId => {
        const leadRef = doc(leadsRef, leadId);
        batch.update(leadRef, {
          corretor_id: selectedCorretor,
          data_distribuicao: Timestamp.now(),
          status: 'novo',
          status_changes: 0
        });
      });

      await batch.commit();
      
      // Remove os leads distribuídos da lista local
      setLeads(prevLeads => prevLeads.filter(lead => !leadsExistentes.includes(lead.id)));
      
      // Atualiza as estatísticas
      setStats(prev => ({
        ...prev,
        naoDistribuidos: prev.naoDistribuidos - leadsExistentes.length,
        distribuidos: prev.distribuidos + leadsExistentes.length
      }));
      
      setSelectedLeads([]);
      setShowDistribuirModal(false);
      setSelectedCorretor('');

      alert(`${leadsExistentes.length} lead(s) distribuído(s) com sucesso!`);

    } catch (error) {
      console.error('Erro ao distribuir leads:', error);
      alert('Erro ao distribuir leads. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar lista de leads
  const limparLista = async () => {
    if (!window.confirm('Tem certeza que deseja excluir todos os leads não distribuídos? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      const leadsRef = collection(db, 'leads');
      const q = query(leadsRef, where('corretor_id', '==', null));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      await carregarLeads();
    } catch (error) {
      console.error('Erro ao limpar lista:', error);
      alert('Erro ao limpar lista. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const processarArquivoCSV = async (file) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let text = e.target.result;
          
          // Remove BOM se existir
          if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
          }
          
          console.log('Conteúdo do arquivo:', text.substring(0, 500));
          
          // Normaliza quebras de linha
          text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          
          const linhas = text.split('\n');
          console.log('Número de linhas:', linhas.length);
          
          if (linhas.length === 0) {
            throw new Error('O arquivo está vazio');
          }
          
          // Detecta o separador (vírgula ou ponto e vírgula)
          const primeiraLinha = linhas[0];
          const separador = primeiraLinha.includes(';') ? ';' : ',';
          console.log('Separador detectado:', separador);
          
          // Remove linhas vazias
          const linhasValidas = linhas.filter(linha => {
            const semEspacos = linha.trim();
            return semEspacos && semEspacos !== separador;
          });

          if (linhasValidas.length === 0) {
            throw new Error('O arquivo não contém dados válidos');
          }
          
          console.log('Primeira linha:', linhasValidas[0]);
          
          // Processa o cabeçalho
          const cabecalho = linhasValidas[0]
            .split(separador)
            .map(col => col.trim())
            .map(col => col.replace(/"/g, ''))
            .map(col => col.toUpperCase());
          
          console.log('Colunas encontradas:', cabecalho);
          console.log('Colunas permitidas:', COLUNAS_PERMITIDAS);
          
          // Verifica cada coluna encontrada
          const colunasValidas = cabecalho.some(col => {
            const isValid = COLUNAS_PERMITIDAS.includes(col);
            console.log(`Coluna "${col}" é válida? ${isValid}`);
            return isValid;
          });

          if (!colunasValidas) {
            throw new Error(
              'O arquivo não contém nenhuma das colunas permitidas.\n\n' +
              `Colunas encontradas: ${cabecalho.join(', ')}\n\n` +
              `Colunas permitidas: ${COLUNAS_PERMITIDAS.join(', ')}`
            );
          }
          
          const colunasEncontradas = {};
          cabecalho.forEach((coluna, index) => {
            if (COLUNAS_PERMITIDAS.includes(coluna)) {
              colunasEncontradas[coluna] = index;
            }
          });

          const leads = [];
          
          // Processa as linhas de dados
          for (let i = 1; i < linhasValidas.length; i++) {
            const linha = linhasValidas[i];
            const valores = linha.split(separador).map(val => val.trim());
            
            const lead = {};
            Object.entries(colunasEncontradas).forEach(([coluna, index]) => {
              if (valores[index]) {
                lead[coluna.toLowerCase().replace(/ /g, '_')] = valores[index].replace(/"/g, '').trim();
              }
            });

            if (Object.keys(lead).length > 0) {
              lead.created_at = new Date();
              lead.corretor_id = null;
              leads.push(lead);
            }
          }

          if (leads.length === 0) {
            throw new Error('Nenhum lead válido encontrado no arquivo.');
          }

          console.log('Leads processados:', leads.slice(0, 2));

          const batch = writeBatch(db);
          const leadsRef = collection(db, 'leads');
          
          leads.forEach(lead => {
            const docRef = doc(leadsRef);
            batch.set(docRef, lead);
          });

          await batch.commit();
          await carregarLeads(); // Recarrega os leads após salvar
          
          setUploadStatus({
            success: true,
            message: `${leads.length} leads importados com sucesso!`
          });
          setSelectedFile(null);
          setShowUploadModal(false); // Fecha o modal após o sucesso
          
        } catch (error) {
          console.error('Erro detalhado:', error);
          setUploadStatus({
            success: false,
            message: error.message || 'Erro ao processar o arquivo CSV.'
          });
        }
      };

      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.error('Erro no processamento:', error);
      setUploadStatus({
        success: false,
        message: 'Erro ao processar o arquivo.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/csv') {
        setUploadStatus({
          success: false,
          message: 'Por favor, selecione um arquivo CSV.'
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      processarArquivoCSV(selectedFile);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <div className="mt-2 flex items-center space-x-4 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {stats.naoDistribuidos} não distribuídos
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {stats.distribuidos} distribuídos
            </span>
          </div>
        </div>
        <div className="flex space-x-4">
          {selectedLeads.length > 0 && (
            <button
              onClick={() => setShowDistribuirModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Distribuir ({selectedLeads.length})
            </button>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Importar CSV
          </button>
          {stats.naoDistribuidos > 0 && (
            <button
              onClick={limparLista}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Limpar Lista
            </button>
          )}
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Carregando leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Nenhum lead encontrado</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {leads.map(lead => (
              <li key={lead.id} className="px-4 py-2 hover:bg-gray-50">
                <div className="flex items-center">
                  {!lead.corretor_id && (
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-4"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads([...selectedLeads, lead.id]);
                        } else {
                          setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                        }
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-primary-600 truncate mr-2">
                          {lead.nome}
                        </p>
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {lead.status || 'Novo'}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-2">
                        {lead.email && <span className="truncate">{lead.email}</span>}
                        {lead.telefone && <span>{lead.telefone}</span>}
                        {lead.plano_atual && <span>{lead.plano_atual}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de Distribuição */}
      {showDistribuirModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Distribuir Leads</h2>
              <button
                onClick={() => setShowDistribuirModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o corretor
                </label>
                <select
                  value={selectedCorretor}
                  onChange={(e) => setSelectedCorretor(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Selecione um corretor</option>
                  {corretores.map(corretor => (
                    <option key={corretor.id} value={corretor.id}>
                      {corretor.name || corretor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDistribuirModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={distribuirLeads}
                  disabled={!selectedCorretor}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Distribuir {selectedLeads.length} leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Importar Leads</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {uploadStatus && (
              <div className={`mb-4 p-4 rounded-md ${uploadStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {uploadStatus.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${uploadStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                      {uploadStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o arquivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Colunas aceitas:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {COLUNAS_PERMITIDAS.map(coluna => (
                    <div key={coluna} className="flex items-center">
                      <span className="text-xs">{coluna}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white
                    ${!selectedFile || uploading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {uploading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 