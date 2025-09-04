document.addEventListener("DOMContentLoaded", () => {
    // URL do seu backend FastAPI
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";

    // ===============================================
    // Lógica do Modal de Autenticação
    // ===============================================

    // Obtenha referências aos elementos HTML
    const openModalNavbar = document.getElementById('open-auth-modal-navbar');
    const openModalDemo = document.getElementById('open-auth-modal-demo');
    const modal = document.getElementById('auth-modal');
    const closeModalBtn = document.querySelector('.close-btn');

    // Elementos do formulário
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
    const fullNameInput = document.getElementById('full-name');
    const usernameInput = document.getElementById('username');
    const contactInput = document.getElementById('contact');
    
    // Referência para o robô
    const robotImage = document.querySelector('.logo-robo-dentro');

    let isLoginMode = true;

    // Função para abrir o modal
    function openModal() {
        modal.style.display = 'flex';
    }

    // Função para fechar o modal
    function closeModal() {
        modal.style.display = 'none';
        isLoginMode = true;
        updateUIMode();
    }

    // Eventos de clique para abrir o modal
    if (openModalNavbar) {
        openModalNavbar.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
    if (openModalDemo) {
        openModalDemo.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // Evento de clique para fechar o modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Lógica para alternar entre Login e Cadastro
    function updateUIMode() {
        if (isLoginMode) {
            submitBtn.textContent = 'Entrar';
            toggleModeLink.textContent = 'Cadastre-se';
            toggleModeLink.parentNode.firstChild.nodeValue = 'Não tem uma conta? ';
            
            // Ajusta o robô para o modo de login
            if (robotImage) {
                robotImage.style.width = '170px';
                robotImage.style.top = '-170px';
            }

            if (fullNameGroup) fullNameGroup.style.display = 'none';
            if (usernameGroup) usernameGroup.style.display = 'none';
            if (contactGroup) contactGroup.style.display = 'none';
            if (emailInput) emailInput.required = true;
            if (passwordInput) passwordInput.required = true;
            if (fullNameInput) fullNameInput.required = false;
            if (usernameInput) usernameInput.required = false;
            if (contactInput) contactInput.required = false;
        } else {
            submitBtn.textContent = 'Cadastrar';
            toggleModeLink.textContent = 'Entrar';
            toggleModeLink.parentNode.firstChild.nodeValue = 'Já tem uma conta? ';

            // Ajusta o robô para o modo de cadastro
            if (robotImage) {
                robotImage.style.width = '100px';
                robotImage.style.top = '-100px';
            }
            
            if (fullNameGroup) fullNameGroup.style.display = 'block';
            if (usernameGroup) usernameGroup.style.display = 'block';
            if (contactGroup) contactGroup.style.display = 'block';
            if (emailInput) emailInput.required = true;
            if (passwordInput) passwordInput.required = true;
            if (fullNameInput) fullNameInput.required = true;
            if (usernameInput) usernameInput.required = true;
            if (contactInput) contactInput.required = true;
        }
        errorMessage.style.display = 'none';
        emailInput.value = '';
        passwordInput.value = '';
        if (fullNameInput) fullNameInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (contactInput) contactInput.value = '';
        attachPasswordToggleListeners();
    }

    toggleModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        updateUIMode();
    });
    
    function attachPasswordToggleListeners() {
        document.querySelectorAll('.toggle-password').forEach(icon => {
            const clonedIcon = icon.cloneNode(true);
            icon.parentNode.replaceChild(clonedIcon, icon);
            
            clonedIcon.addEventListener('click', () => {
                const passwordInput = clonedIcon.previousElementSibling;
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    clonedIcon.classList.remove('fa-eye-slash');
                    clonedIcon.classList.add('fa-eye');
                } else {
                    passwordInput.type = 'password';
                    clonedIcon.classList.remove('fa-eye');
                    clonedIcon.classList.add('fa-eye-slash');
                }
            });
        });
    }

    // Submissão do formulário com a lógica do Firebase
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            errorMessage.style.display = 'none';

            try {
                if (isLoginMode) {
                    await window.auth.signInWithEmailAndPassword(email, password);
                    console.log('Login bem-sucedido!');
                    window.location.href = 'monitoramento.html';
                } else {
                    const fullName = fullNameInput.value;
                    const username = usernameInput.value;
                    const contact = contactInput.value;

                    const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    if (!window.db || typeof window.db.collection !== 'function') {
                        console.error('Erro: Objeto "db" do Firestore não está disponível ou não foi inicializado corretamente.');
                        await user.delete();
                        errorMessage.textContent = 'Erro de conexão com o banco de dados. Tente novamente.';
                        errorMessage.style.display = 'block';
                        return;
                    }

                    try {
                        await window.db.collection('users').doc(user.uid).set({
                            email: user.email,
                            fullName: fullName,
                            username: username,
                            contact: contact,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            plan_type: 'gratuito'
                        });
                        alert('Cadastro bem-sucedido! Você já pode entrar.');
                        isLoginMode = true;
                        updateUIMode();
                        window.location.href = 'monitoramento.html';
                    } catch (firestoreError) {
                        console.error('Erro ao salvar dados no Firestore. Excluindo usuário do Auth:', firestoreError);
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
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                const result = await window.auth.signInWithPopup(provider);
                const user = result.user;

                if (!window.db || typeof window.db.collection !== 'function') {
                    console.error('Erro: Objeto "db" do Firestore não está disponível para Google Sign-In.');
                    errorMessage.textContent = 'Erro de conexão com o banco de dados via Google. Tente novamente.';
                    errorMessage.style.display = 'block';
                    return;
                }

                try {
                    const userRef = window.db.collection('users').doc(user.uid);
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
                    }
                    window.location.href = 'monitoramento.html';
                } catch (firestoreErrorGoogle) {
                    console.error('Erro ao salvar/verificar dados do usuário Google no Firestore:', firestoreErrorGoogle);
                    errorMessage.textContent = `Falha ao salvar dados via Google: ${firestoreErrorGoogle.message || 'Erro desconhecido.'}`;
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro no login com Google:', error);
                errorMessage.textContent = getFriendlyErrorMessage(error.code);
                errorMessage.style.display = 'block';
            }
        });
    }

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
    
    // --- Lógica da Demonstração de Animação ---
    const startDemoBtn = document.getElementById('start-demo-btn');
    const demoStates = document.querySelectorAll('.demo-state');
    let currentStateIndex = 0;
    let demoInterval;

    function showState(index) {
        demoStates.forEach((state, i) => {
            if (i === index) {
                state.classList.add('active-state');
            } else {
                state.classList.remove('active-state');
            }
        });
    }

    function startDemo() {
        currentStateIndex = 0;
        showState(currentStateIndex);
        if (demoInterval) {
            clearInterval(demoInterval);
        }
        demoInterval = setInterval(() => {
            currentStateIndex++;
            if (currentStateIndex < demoStates.length) {
                showState(currentStateIndex);
            } else {
                clearInterval(demoInterval);
                setTimeout(() => {
                    startDemo();
                }, 3000);
            }
        }, 1500);
    }

    if (startDemoBtn) {
        startDemoBtn.addEventListener('click', startDemo);
    }
    
    startDemo();
    updateUIMode();
    attachPasswordToggleListeners();
    
    // ===============================================
    // Lógica do FAQ (Perguntas Frequentes)
    // ===============================================

    // Função assíncrona para registrar a visualização do FAQ no backend
    // e atualizar a contagem na interface do usuário
    async function recordFaqView(faqId, viewsElement) {
        try {
            // AQUI ESTÁ A MUDANÇA - A URL agora aponta para a nova rota de FAQs populares
            const response = await fetch(`${BACKEND_URL}/popular_faqs/${faqId}/visualizacao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Erro ao registrar visualização: status ${response.status}`);
            } else {
                console.log(`Visualização para o FAQ ${faqId} registrada com sucesso.`);
                const data = await response.json();
                if (data.visualizacoes !== undefined) {
                    const eyeIconHtml = '<i class="fas fa-eye"></i>';
                    viewsElement.innerHTML = `${eyeIconHtml} ${data.visualizacoes} visualizações`;
                }
            }
        } catch (error) {
            console.error("Erro na requisição para registrar visualização:", error);
        }
    }
    
    // Lógica para alternar a visibilidade da resposta do FAQ e registrar a visualização
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Fecha todos os outros itens abertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    otherItem.querySelector('.faq-question .fa-chevron-down').style.transform = 'rotate(0deg)';
                }
            });

            // Alterna a classe 'active' no item clicado
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('.faq-question .fa-chevron-down');
            
            if (item.classList.contains('active')) {
                // Se já estiver ativo, fecha
                item.classList.remove('active');
                answer.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                // Se não estiver ativo, abre e registra a visualização
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';

                const faqId = item.dataset.faqId;
                if (faqId) {
                    // Encontre o elemento de visualizações e passe-o para a função
                    const viewsElement = item.querySelector('.faq-meta span:first-child');
                    recordFaqView(faqId, viewsElement);
                }
            }
        });
    });
});