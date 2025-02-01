import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { CloudArrowUpIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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

export default function DistribuirLeads() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const processarArquivoCSV = async (file) => {
    setUploading(true);
    setUploadStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const linhas = text.split('\n');
          const cabecalho = linhas[0].split(',').map(col => col.trim().toUpperCase());
          
          const colunasValidas = cabecalho.some(col => COLUNAS_PERMITIDAS.includes(col));
          if (!colunasValidas) {
            throw new Error('O arquivo não contém nenhuma das colunas permitidas.');
          }
          
          const colunasEncontradas = {};
          cabecalho.forEach((coluna, index) => {
            if (COLUNAS_PERMITIDAS.includes(coluna)) {
              colunasEncontradas[coluna] = index;
            }
          });

          const leads = [];
          
          for (let i = 1; i < linhas.length; i++) {
            if (!linhas[i].trim()) continue;
            
            const valores = linhas[i].split(',').map(val => val.trim());
            const lead = {};
            
            Object.entries(colunasEncontradas).forEach(([coluna, index]) => {
              if (valores[index]) {
                lead[coluna.toLowerCase().replace(/ /g, '_')] = valores[index];
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

          const batch = writeBatch(db);
          const leadsRef = collection(db, 'leads');
          
          leads.forEach(lead => {
            const docRef = doc(leadsRef);
            batch.set(docRef, lead);
          });

          await batch.commit();
          
          setUploadStatus({
            success: true,
            message: `${leads.length} leads importados com sucesso!`
          });
          setSelectedFile(null);
          
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          setUploadStatus({
            success: false,
            message: error.message || 'Erro ao processar o arquivo CSV.'
          });
        }
      };

      reader.readAsText(file);
    } catch (error) {
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
              12 não distribuídos
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              45 distribuídos
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
          Importar CSV
        </button>
      </div>

      {/* Lista de Leads */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {/* Exemplo de lead */}
          <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-600 truncate">João Silva</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Ativo
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="sm:flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="truncate">joao@email.com</span>
                      <span className="mx-2">•</span>
                      <span>11999999999</span>
                      <span className="mx-2">•</span>
                      <span>Unimed</span>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <button className="text-xs text-primary-600 hover:text-primary-900">
                      Distribuir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

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