import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, createUserWithRole, verifyAndCreateUserDocument } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc, getFirestore } from 'firebase/firestore';

const db = getFirestore();

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        console.log('Tentando fazer login com:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuário autenticado:', user.uid);
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          console.log('Documento existe?', userDoc.exists());
          
          let userData;
          
          if (!userDoc.exists()) {
            console.log('Documento não encontrado, criando...');
            const result = await verifyAndCreateUserDocument(user);
            userData = {
              role: result.role
            };
          } else {
            userData = userDoc.data();
          }

          console.log('Dados do usuário:', userData);
          
          if (userData.role === 'gestor') {
            console.log('Redirecionando para dashboard do gestor');
            navigate('/dashboard-gestor');
          } else if (userData.role === 'corretor') {
            console.log('Redirecionando para dashboard do corretor');
            navigate('/dashboard-corretor');
          } else {
            console.log('Papel do usuário não reconhecido:', userData.role);
            setError('Tipo de usuário não reconhecido.');
            await auth.signOut();
          }
        } catch (firestoreError) {
          console.error('Erro detalhado ao buscar dados do usuário:', {
            code: firestoreError.code,
            message: firestoreError.message,
            details: firestoreError
          });
          setError('Erro ao carregar dados do usuário. Tente novamente.');
          await auth.signOut();
        }
      } else {
        // Registro
        console.log('Tentando criar novo usuário:', email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Novo usuário criado:', user.uid);

        try {
          await createUserWithRole({
            uid: user.uid,
            email: user.email,
            name,
            role: 'corretor',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });

          console.log('Perfil do corretor criado com sucesso');
          navigate('/dashboard-corretor');
        } catch (firestoreError) {
          console.error('Erro detalhado ao criar perfil:', {
            code: firestoreError.code,
            message: firestoreError.message,
            details: firestoreError
          });
          await auth.signOut();
          setError('Erro ao criar perfil do usuário. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro detalhado na operação:', {
        code: error.code,
        message: error.message,
        details: error
      });
      
      let mensagemErro = 'Ocorreu um erro. Tente novamente.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          mensagemErro = 'Este email já está sendo usado. Por favor, use outro email ou faça login.';
          break;
        case 'auth/invalid-email':
          mensagemErro = 'Email inválido. Por favor, verifique o email digitado.';
          break;
        case 'auth/weak-password':
          mensagemErro = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          break;
        case 'auth/user-not-found':
          mensagemErro = 'Usuário não encontrado. Verifique o email ou crie uma nova conta.';
          break;
        case 'auth/wrong-password':
          mensagemErro = 'Senha incorreta. Tente novamente.';
          break;
        default:
          mensagemErro = `Erro: ${error.message}`;
      }

      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#1721e3]">
      {/* Background com gradiente e blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1721e3] via-[#1721e3]/90 to-[#1721e3]/80">
        {/* Elementos decorativos estilo Apple */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Conteúdo do formulário */}
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden p-8 space-y-8 border border-white/20">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-center text-sm text-white/80">
              {isLogin ? 'Acesse sua conta' : 'Comece sua jornada conosco'}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="sr-only">
                    Nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    className="appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/50 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent sm:text-sm backdrop-blur-sm"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
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
                  placeholder="Email"
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
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-300 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-[#1721e3] bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              >
                {isLogin ? 'Entrar' : 'Criar conta'}
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-sm text-white/80 hover:text-white transition-colors duration-200"
              >
                {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Entre'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 