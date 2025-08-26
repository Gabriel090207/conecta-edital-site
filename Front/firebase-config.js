// firebase-config.js

// Suas configurações do Firebase que você copiou do console
const firebaseConfig = {
    apiKey: "AIzaSyAaKKRHcQqsfjLjPczsgxJhnjfyY4cclkQ",
    authDomain: "conectaeditalapp.firebaseapp.com",
    projectId: "conectaeditalapp",
    storageBucket: "conectaeditalapp.firebasestorage.app",
    messagingSenderId: "1057915288128",
    appId: "1:1057915288128:web:30799f8972115a48173da5",
    measurementId: "G-ZG4JPW6X3B"
};

// Inicializa o Firebase e armazena a referência em uma variável global
window.app = firebase.initializeApp(firebaseConfig);

// Inicializa e armazena as referências do Auth e Firestore globalmente
window.auth = firebase.auth();
window.db = firebase.firestore();