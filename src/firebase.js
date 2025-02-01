import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where,
  connectFirestoreEmulator 
} from 'firebase/firestore';

const firebaseConfig = {
  // Substitua estas configurações pelas suas próprias do Firebase Console
  apiKey: "AIzaSyCUgM3pmBHVYNCSoSi0jQgsIqnK-zPizmk",
  authDomain: "newliv-db.firebaseapp.com",
  projectId: "newliv-db",
  storageBucket: "newliv-db.appspot.com",
  messagingSenderId: "188860434955",
  appId: "1:188860434955:web:eaa51bd5b670235c0a150e",
  measurementId: "G-4GC296K7NN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Função para criar um novo usuário com estrutura específica
export const createUserWithRole = async (userData) => {
  try {
    const { uid, ...restData } = userData;
    console.log('Criando documento do usuário:', uid, restData);

    // Cria o documento do usuário com dados adicionais
    await setDoc(doc(db, 'users', uid), {
      ...restData,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'active',
      lastLogin: new Date().toISOString()
    });

    console.log('Documento do usuário criado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro detalhado ao criar usuário:', {
      code: error.code,
      message: error.message,
      details: error
    });
    throw error;
  }
};

// Função para verificar e criar documento de usuário se necessário
export const verifyAndCreateUserDocument = async (user, defaultRole = 'corretor') => {
  try {
    console.log('Verificando documento do usuário:', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    
    // Determina o papel com base no email
    const role = user.email.includes('gestor') ? 'gestor' : defaultRole;
    
    // Cria o documento se não existir
    await setDoc(userDocRef, {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });

    console.log('Documento do usuário verificado/criado com sucesso');
    return { success: true, role };
  } catch (error) {
    console.error('Erro ao verificar/criar documento do usuário:', error);
    throw error;
  }
};

// Função para verificar se já existe um gestor
export const checkIfAdminExists = async () => {
  try {
    console.log('Verificando existência de gestor...');
    const q = query(collection(db, 'users'), where('role', '==', 'gestor'));
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    console.log('Gestor existe?', exists);
    return exists;
  } catch (error) {
    console.error('Erro ao verificar gestor:', error);
    return false;
  }
};

// Função para criar o primeiro gestor
export const createFirstAdmin = async (email, password, name) => {
  try {
    console.log('Iniciando criação do primeiro gestor...');
    
    // Verifica se já existe um gestor
    const adminExists = await checkIfAdminExists();
    if (adminExists) {
      console.log('Já existe um gestor no sistema');
      return {
        success: false,
        message: 'Já existe um gestor cadastrado no sistema.'
      };
    }

    // Verifica se o email contém "gestor"
    if (!email.includes('gestor')) {
      console.log('Email não contém a palavra "gestor"');
      return {
        success: false,
        message: 'O email do gestor deve conter a palavra "gestor"'
      };
    }

    // Cria o usuário no Authentication
    console.log('Criando usuário no Authentication...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Usuário criado:', userCredential.user.uid);
    
    // Cria o documento do usuário no Firestore
    console.log('Criando documento do gestor no Firestore...');
    await createUserWithRole({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name,
      role: 'gestor',
    });

    console.log('Gestor criado com sucesso');
    return {
      success: true,
      message: 'Gestor criado com sucesso! Você já pode fazer login.',
      uid: userCredential.user.uid
    };
  } catch (error) {
    console.error('Erro detalhado ao criar gestor:', {
      code: error.code,
      message: error.message,
      details: error
    });
    
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: 'Este email já está sendo usado. Por favor, use outro email.'
      };
    }
    
    return {
      success: false,
      message: 'Erro ao criar gestor. Por favor, tente novamente.'
    };
  }
};

// Regras de Segurança do Firestore
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/

export default app; 