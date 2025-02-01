import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';

export default function GerenciarCorretores() {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorretores();
  }, []);

  const fetchCorretores = async () => {
    setLoading(true);
    try {
      const corretoresRef = collection(db, 'users');
      const corretoresQuery = query(
        corretoresRef,
        where('role', '==', 'corretor')
      );
      
      const snapshot = await getDocs(corretoresQuery);
      const corretoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCorretores(corretoresData);
    } catch (error) {
      console.error('Erro ao buscar corretores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (corretorId, novoStatus) => {
    try {
      const corretorRef = doc(db, 'users', corretorId);
      await updateDoc(corretorRef, {
        status: novoStatus,
        updated_at: Timestamp.now()
      });

      // Atualiza o estado local
      setCorretores(prevCorretores =>
        prevCorretores.map(corretor =>
          corretor.id === corretorId
            ? { ...corretor, status: novoStatus }
            : corretor
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do corretor. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando corretores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Corretores</h1>
        <p className="mt-2 text-gray-600">Visualize e gerencie os corretores cadastrados</p>
      </div>

      {/* Card de Métrica */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <UserGroupIcon className="h-8 w-8" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total de Corretores</p>
            <p className="text-2xl font-semibold text-gray-900">{corretores.length}</p>
          </div>
        </div>
      </div>

      {/* Lista de Corretores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Corretores Cadastrados
            </h3>
            <p className="text-sm text-gray-500">
              Gerencie o status dos corretores
            </p>
          </div>
          <button
            onClick={fetchCorretores}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Atualizar lista"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Corretor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {corretores.map((corretor) => (
                <tr key={corretor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{corretor.name}</div>
                        <div className="text-sm text-gray-500">{corretor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(corretor.status || 'inativo')}`}>
                      {(corretor.status || 'inativo').charAt(0).toUpperCase() + (corretor.status || 'inativo').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {corretor.created_at ? new Date(corretor.created_at.toDate()).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {corretor.status === 'ativo' ? (
                      <button
                        onClick={() => handleToggleStatus(corretor.id, 'inativo')}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <XCircleIcon className="h-5 w-5 mr-1" />
                        Inativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(corretor.id, 'ativo')}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        Ativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 