// login-cadastro.js

// 'auth' e 'db' são importados globalmente do firebase-config.js
// que deve ser carregado antes deste script no HTML.
console.log('Script login-cadastro.js iniciado!'); 

document.addEventListener('DOMContentLoaded', () => {
    // Obtenha referências aos elementos HTML
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const toggleModeLink = document.getElementById('toggle-mode');
    const errorMessage = document.getElementById('error-message');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    const fullNameGroup = document.getElementById('full-name-group');
    const usernameGroup = document.getElementById('username-group');
    const contactGroup = document.getElementById('contact-group');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');

    const fullNameInput = document.getElementById('full-name');
    const usernameInput = document.getElementById('username');
    const contactInput = document.getElementById('contact');
    const confirmPasswordInput = document.getElementById('confirm-password');

    let isLoginMode = true;

    function updateUIMode() {
        if (isLoginMode) {
            submitBtn.textContent = 'Entrar';
            toggleModeLink.textContent = 'Cadastre-se';
            toggleModeLink.parentNode.firstChild.nodeValue = 'Não tem uma conta? ';
            document.querySelector('.form-header h2').textContent = 'Bem-vindo(a) de Volta!';
            document.querySelector('.form-header p').textContent = 'Entre ou crie sua conta para acessar o Conecta Edital.';
            fullNameGroup.style.display = 'none';
            usernameGroup.style.display = 'none';
            contactGroup.style.display = 'none';
            confirmPasswordGroup.style.display = 'none';
            emailInput.required = true;
            passwordInput.required = true;
            fullNameInput.required = false;
            usernameInput.required = false;
            contactInput.required = false;
            confirmPasswordInput.required = false;
        } else {
            submitBtn.textContent = 'Cadastrar';
            toggleModeLink.textContent = 'Entrar';
            toggleModeLink.parentNode.firstChild.nodeValue = 'Já tem uma conta? ';
            document.querySelector('.form-header h2').textContent = 'Crie Sua Conta';
            document.querySelector('.form-header p').textContent = 'É rápido e fácil!';
            fullNameGroup.style.display = 'block';
            usernameGroup.style.display = 'block';
            contactGroup.style.display = 'block';
            confirmPasswordGroup.style.display = 'block';
            emailInput.required = true;
            passwordInput.required = true;
            fullNameInput.required = true;
            usernameInput.required = true;
            contactInput.required = true;
            confirmPasswordInput.required = true;
        }
        errorMessage.style.display = 'none';
        emailInput.value = '';
        passwordInput.value = '';
        fullNameInput.value = '';
        usernameInput.value = '';
        contactInput.value = '';
        confirmPasswordInput.value = '';
    }

    toggleModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        updateUIMode();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulário de cadastro enviado.');
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.style.display = 'none';

        try {
            if (isLoginMode) {
                await window.auth.signInWithEmailAndPassword(email, password);
                console.log('Login bem-sucedido!');
                alert('Login bem-sucedido!');
                window.location.href = 'monitoramento.html'; // Redireciona APÓS o login
            } else {
                const fullName = fullNameInput.value;
                const username = usernameInput.value;
                const contact = contactInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (password !== confirmPassword) {
                    errorMessage.textContent = 'As senhas não coincidem.';
                    errorMessage.style.display = 'block';
                    return;
                }

                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                console.log('Usuário Firebase Auth criado com UID:', user.uid);
                console.log('Verificando objeto db:', db); 
                console.log('Tipo de db:', typeof db); 

                if (!db || typeof db.collection !== 'function') {
                    console.error('Erro: Objeto "db" do Firestore não está disponível ou não foi inicializado corretamente.');
                    await user.delete(); 
                    errorMessage.textContent = 'Erro de conexão com o banco de dados. Tente novamente.';
                    errorMessage.style.display = 'block';
                    return;
                }

                try {
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        fullName: fullName,
                        username: username,
                        contact: contact,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        plan_type: 'gratuito'
                    });

                    console.log('Cadastro bem-sucedido! Dados salvos no Firestore.', user);
                    alert('Cadastro bem-sucedido! Você já pode entrar.');
                    isLoginMode = true;
                    updateUIMode();
                    window.location.href = 'monitoramento.html'; // Redireciona APENAS APÓS o sucesso no Firestore
                } catch (firestoreError) {
                    console.error('Erro REAL ao salvar dados no Firestore. Excluindo usuário do Auth:', firestoreError);
                    errorMessage.textContent = `Falha ao salvar dados: ${firestoreError.message || 'Erro desconhecido.'}`;
                    errorMessage.style.display = 'block';
                    
                    if (user && user.delete) {
                        try {
                            await user.delete();
                            console.log('Usuário do Auth excluído devido a falha no Firestore.');
                        } catch (deleteError) {
                            console.error('Erro ao tentar excluir usuário do Auth:', deleteError);
                        }
                    }
                }
            }
        } catch (authError) {
            console.error('Erro de autenticação do Firebase:', authError);
            errorMessage.textContent = getFriendlyErrorMessage(authError.code);
            errorMessage.style.display = 'block';
        }
    });

    googleSignInBtn.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await window.auth.signInWithPopup(provider);
            const user = result.user;

            console.log('Usuário Google Auth logado com UID:', user.uid);
            console.log('Verificando objeto db para Google Sign-In:', db);
            console.log('Tipo de db para Google Sign-In:', typeof db);

            if (!db || typeof db.collection !== 'function') {
                console.error('Erro: Objeto "db" do Firestore não está disponível para Google Sign-In.');
                errorMessage.textContent = 'Erro de conexão com o banco de dados via Google. Tente novamente.';
                errorMessage.style.display = 'block';
                return;
            }

            try {
                const userRef = db.collection('users').doc(user.uid);
                const doc = await userRef.get();

                if (!doc.exists) {
                    await userRef.set({
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        plan_type: 'gratuito'
                    });
                    console.log('Dados do usuário Google salvos no Firestore.');
                } else {
                    console.log('Usuário Google já existe no Firestore. Sem necessidade de criar.');
                }
                console.log('Login com Google bem-sucedido!', user);
                alert('Login com Google bem-sucedido!');
                window.location.href = 'monitoramento.html'; // Redireciona APÓS o login com Google
            } catch (firestoreErrorGoogle) {
                console.error('Erro REAL ao salvar/verificar dados do usuário Google no Firestore:', firestoreErrorGoogle);
                errorMessage.textContent = `Falha ao salvar dados via Google: ${firestoreErrorGoogle.message || 'Erro desconhecido.'}`;
                errorMessage.style.display = 'block';
            }

        } catch (error) {
            console.error('Erro no login com Google:', error);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
            errorMessage.style.display = 'block';
        }
    });

    function getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'Este e-mail já está em uso. Tente entrar ou redefinir a senha.';
            case 'auth/invalid-email':
                return 'Endereço de e-mail inválido.';
            case 'auth/weak-password':
                return 'A senha deve ter pelo menos 6 caracteres.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'E-mail ou senha incorretos.';
            case 'auth/network-request-failed':
                return 'Erro de conexão. Verifique sua internet.';
            case 'auth/popup-closed-by-user':
                return 'Login com Google cancelado. A janela pop-up foi fechada.';
            case 'auth/cancelled-popup-request':
                return 'Login com Google já em andamento. Tente novamente.';
            default:
                return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
        }
    }

    updateUIMode();
});