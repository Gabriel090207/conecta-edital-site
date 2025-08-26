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
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const fullNameInput = document.getElementById('full-name');
    const usernameInput = document.getElementById('username');
    const contactInput = document.getElementById('contact');
    const confirmPasswordInput = document.getElementById('confirm-password');

    let isLoginMode = true;

    // Função para abrir o modal
    function openModal() {
        modal.style.display = 'flex';
    }

    // Função para fechar o modal
    function closeModal() {
        modal.style.display = 'none';
        // Reinicia o estado para o modo de login quando o modal é fechado
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

    // Submissão do formulário com a lógica do Firebase
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMessage.style.display = 'none';

        try {
            if (isLoginMode) {
                await window.auth.signInWithEmailAndPassword(email, password);
                console.log('Login bem-sucedido!');
                alert('Login bem-sucedido!');
                window.location.href = 'monitoramento.html';
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

    // Login com Google
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
                alert('Login com Google bem-sucedido!');
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

    // Mapeamento de mensagens de erro do Firebase
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

    // ===============================================
    // Outras lógicas da página inicial (mantidas)
    // ===============================================

    // 1. Funcionalidade do Acordeão (FAQ)
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains("active")) {
                    otherItem.classList.remove("active");
                    const otherAnswer = otherItem.querySelector(".faq-answer");
                    if (otherAnswer) {
                        otherAnswer.style.maxHeight = "0px";
                        otherAnswer.style.paddingTop = "0px";
                        otherAnswer.style.paddingBottom = "0px";
                    }
                }
            });
            if (isActive) {
                item.classList.remove("active");
                if (answer) {
                    answer.style.maxHeight = "0px";
                    answer.style.paddingTop = "0px";
                    answer.style.paddingBottom = "0px";
                }
            } else {
                item.classList.add("active");
                if (answer) {
                    answer.style.maxHeight = (answer.scrollHeight + 10 + 20) + "px";
                    answer.style.paddingTop = "10px";
                    answer.style.paddingBottom = "20px";
                }
            }
        });
    });

    document.addEventListener("click", (event) => {
        const faqAccordionContainer = document.querySelector(".faq-accordion");
        if (faqAccordionContainer && !faqAccordionContainer.contains(event.target)) {
            faqItems.forEach(item => {
                item.classList.remove("active");
                const answer = item.querySelector(".faq-answer");
                if (answer) {
                    answer.style.maxHeight = "0px";
                    answer.style.paddingTop = "0px";
                    answer.style.paddingBottom = "0px";
                }
            });
        }
    });

    // 2. Scroll Suave para links da Navbar
    document.querySelectorAll('.navbar-center-index a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar-index').offsetHeight;
                const offsetTop = targetElement.offsetTop - navbarHeight - 20;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Lógica da Demonstração de Monitoramento (Seção "Precisão")
    const uploadBox = document.querySelector('.upload-box');
    const pdfFileInput = document.createElement('input');
    pdfFileInput.type = 'file';
    pdfFileInput.accept = 'application/pdf';
    pdfFileInput.style.display = 'none';

    const keywordInput = document.querySelector('#testar input[type="text"]');
    const emailInputDemo = document.querySelector('#testar input[type="email"]');
    const analisarIaBtn = document.querySelector('.btn-analisar-ia');
    let pdfFile = null;

    if (uploadBox) {
        uploadBox.addEventListener('click', () => {
            pdfFileInput.click();
        });
    }

    pdfFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            pdfFile = file;
            uploadBox.innerHTML = `<i class="fas fa-file-pdf"></i><p class="upload-text">${file.name}</p>`;
        } else {
            alert('Por favor, selecione um arquivo PDF válido.');
            pdfFile = null;
            uploadBox.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p class="upload-text">Clique aqui ou arraste seu PDF</p><small>Tamanho máximo: 5MB - Apenas arquivos PDF</small>`;
        }
    });

    if (analisarIaBtn) {
        analisarIaBtn.addEventListener('click', async () => {
            const keyword = keywordInput.value.trim();
            const email = emailInputDemo.value.trim();
            if (!pdfFile || !keyword || !email) {
                alert('Por favor, anexe um PDF e preencha todos os campos.');
                return;
            }
            analisarIaBtn.disabled = true;
            analisarIaBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';
            const formData = new FormData();
            formData.append('pdf_file', pdfFile);
            formData.append('keyword', keyword);
            formData.append('email', email);
            try {
                const response = await fetch(`${BACKEND_URL}/api/test-monitoring`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Análise concluída! ' + result.message);
                } else {
                    alert('Erro na análise: ' + (result.detail || 'Ocorreu um erro inesperado.'));
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Ocorreu um erro ao se conectar com o servidor. Verifique o backend.');
            } finally {
                analisarIaBtn.disabled = false;
                analisarIaBtn.innerHTML = '<i class="fas fa-bolt"></i> Analisar com IA Agora';
            }
        });
    }

    // 4. Lógica da Demonstração de Animação
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
    
    // Iniciar a demonstração automaticamente ao carregar a página
    startDemo();
});