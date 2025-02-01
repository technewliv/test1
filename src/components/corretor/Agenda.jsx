import React, { useState } from 'react';
import { 
  CalendarIcon, 
  PlusIcon,
  BellIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Agenda() {
  const [eventos, setEventos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    lembrete: '30'
  });

  const criarEvento = (e) => {
    e.preventDefault();
    const dataHora = new Date(novoEvento.data + 'T' + novoEvento.hora);
    
    const novoEventoObj = {
      id: Date.now().toString(),
      titulo: novoEvento.titulo,
      descricao: novoEvento.descricao,
      data: dataHora,
      lembrete_minutos: parseInt(novoEvento.lembrete)
    };

    setEventos([...eventos, novoEventoObj]);
    setNovoEvento({
      titulo: '',
      descricao: '',
      data: '',
      hora: '',
      lembrete: '30'
    });
    setShowForm(false);
  };

  const excluirEvento = (eventoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    setEventos(eventos.filter(evento => evento.id !== eventoId));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus compromissos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Evento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Novo Evento</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={criarEvento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  required
                  value={novoEvento.titulo}
                  onChange={(e) => setNovoEvento({...novoEvento, titulo: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento({...novoEvento, descricao: e.target.value})}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    required
                    value={novoEvento.data}
                    onChange={(e) => setNovoEvento({...novoEvento, data: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hora</label>
                  <input
                    type="time"
                    required
                    value={novoEvento.hora}
                    onChange={(e) => setNovoEvento({...novoEvento, hora: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lembrete</label>
                <select
                  value={novoEvento.lembrete}
                  onChange={(e) => setNovoEvento({...novoEvento, lembrete: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="5">5 minutos antes</option>
                  <option value="10">10 minutos antes</option>
                  <option value="15">15 minutos antes</option>
                  <option value="30">30 minutos antes</option>
                  <option value="60">1 hora antes</option>
                  <option value="1440">1 dia antes</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {eventos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sem eventos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando um novo evento na sua agenda.
            </p>
          </div>
        ) : (
          eventos.map((evento) => (
            <div
              key={evento.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{evento.titulo}</h3>
                  {evento.descricao && (
                    <p className="mt-1 text-sm text-gray-500">{evento.descricao}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {evento.data.toLocaleDateString('pt-BR')} às{' '}
                      {evento.data.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center">
                      <BellIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {evento.lembrete_minutos} minutos antes
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => excluirEvento(evento.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 