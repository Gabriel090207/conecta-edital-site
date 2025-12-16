// firebase-config.js

// Suas configurações do Firebase que você copiou do console
const firebaseConfig = {
  apiKey: "AIzaSyCyGbbwPzPZgH4TL2KM8PFSKMzhvn-eT2o",
  authDomain: "conecta-edital.firebaseapp.com",
  projectId: "conecta-edital",
  storageBucket: "conecta-edital.firebasestorage.app",
  messagingSenderId: "71801719922",
  appId: "1:71801719922:web:21c5b45efd7b37a34ec6eb",
  measurementId: "G-T191Z3VHRM"
};

// Inicializa o Firebase e armazena a referência em uma variável global
window.app = firebase.initializeApp(firebaseConfig);

// Inicializa e armazena as referências do Auth e Firestore globalmente
window.auth = firebase.auth();
window.db = firebase.firestore();