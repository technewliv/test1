import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFirstAdmin } from '../firebase';

export default function CreateAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const result = await createFirstAdmin(email, password, name);
      setMessage(result.message);
      setSuccess(result.success);
      if (result.success) {
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (error) {
      setMessage(error.message);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1721e3] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Criar Primeiro Gestor
          </h2>
          <p className="mt-2 text-center text-sm text-white/80">
            Este formulário deve ser usado apenas uma vez para criar o primeiro gestor do sistema
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/50 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent sm:text-sm backdrop-blur-sm"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/50 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent sm:text-sm backdrop-blur-sm"
                placeholder="Email (deve conter 'gestor')"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/50 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent sm:text-sm backdrop-blur-sm"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center py-2 rounded-lg ${
              success ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            {success ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-[#1721e3] bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                Voltar para o Login
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-[#1721e3] bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Criando...' : 'Criar Gestor'}
              </button>
            )}

            {!success && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-sm text-white/80 hover:text-white transition-colors duration-200"
              >
                Voltar para o Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 