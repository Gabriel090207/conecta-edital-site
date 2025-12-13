document.addEventListener("DOMContentLoaded", () => {
    // URL do seu backend FastAPI
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";

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


    // ===============================================
// Esqueceu a senha (Reset via Firebase)
// ===============================================

const forgotPasswordLink = document.querySelector('.forgot-password-text');

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.auth) {
            alert("Erro: sistema de autenticação não disponível.");
            return;
        }

        const email = emailInput?.value.trim();

        if (!email) {
            alert("Por favor, digite seu e-mail para redefinir a senha.");
            emailInput.focus();
            return;
        }

        try {
            await window.auth.sendPasswordResetEmail(email);
        
            alert(
                "📧 Se existir uma conta com este e-mail, " +
                "enviamos um link de redefinição de senha.\n\n" +
                "Verifique sua caixa de entrada ou spam."
            );
        
        } catch (error) {
            console.error("Erro no reset de senha:", error);
        
            if (error.code === "auth/user-not-found") {
                alert(
                    "📧 Se existir uma conta com este e-mail, " +
                    "enviamos um link de redefinição.\n\n" +
                    "Caso tenha criado a conta com Google, use o botão 'Entrar com Google'."
                );
            } 
            else if (error.code === "auth/invalid-email") {
                alert("E-mail inválido.");
            } 
            else {
                alert("Erro ao tentar redefinir a senha. Tente novamente.");
            }
        }
        
    });
}

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

    // Permitir apenas números no campo de WhatsApp
// Permitir apenas números e limitar a 11 dígitos
if (contactInput) {
    contactInput.addEventListener("input", () => {
        // Remove tudo que não for número
        contactInput.value = contactInput.value.replace(/\D/g, "");

        // Limita para no máximo 11 dígitos
        if (contactInput.value.length > 11) {
            contactInput.value = contactInput.value.slice(0, 11);
        }
    });
}

    
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
    
            // limpamos redirect quando o usuário clica em ENTRAR
            localStorage.removeItem("redirect_after_login"); 
    
            openModal();
        });
    }
    
    if (openModalDemo) {
        openModalDemo.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // BOTÕES "Escolher Plano" — abre o modal e define redirecionamento
document.querySelectorAll(".choose-plan-btn-index").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();

        // Marca o redirecionamento desejado
        localStorage.setItem("redirect_after_login", "planos.html");

        // Abre o modal normalmente
        openModal();
    });
});


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

        
        if (fullNameInput) fullNameInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (contactInput) contactInput.value = '';

        if (passwordInput) passwordInput.value = '';

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

                    // Verifica se existe intenção de ir para Planos
                    // Verifica se existe intenção de ir para Planos
const redirect = localStorage.getItem("redirect_after_login");

if (redirect) {
    localStorage.removeItem("redirect_after_login");
    window.location.href = redirect;
} else {
    window.location.href = 'monitoramento.html';
}


                    
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
                    const redirect = localStorage.getItem("redirect_after_login");

                    if (redirect) {
                        localStorage.removeItem("redirect_after_login");
                        window.location.href = redirect;
                    } else {
                        window.location.href = 'monitoramento.html';
                    }
                    
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

    // NOVO: Função para carregar as visualizações do backend
    async function loadFaqViews() {
        try {
            const response = await fetch(`${BACKEND_URL}/popular_faqs/stats`);
            if (response.ok) {
                const stats = await response.json();
                document.querySelectorAll('.faq-item').forEach(item => {
                    const faqId = item.dataset.faqId;
                    if (stats[faqId] !== undefined) {
                        const viewsElement = item.querySelector('.faq-meta span:first-child');
                        const eyeIconHtml = '<i class="fas fa-eye"></i>';
                        viewsElement.innerHTML = `${eyeIconHtml} ${stats[faqId]} visualizações`;
                    }
                });
            }
        } catch (error) {
            console.error("Erro ao carregar visualizações de FAQ:", error);
        }
    }
    
    // NOVO: Chamar a função ao carregar a página
    loadFaqViews();

    // Função assíncrona para registrar a visualização do FAQ no backend
    // e atualizar a contagem na interface do usuário
    async function recordFaqView(faqId, viewsElement) {
        try {
            const response = await fetch(`${BACKEND_URL}/popular_faqs/${faqId}/visualizacao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Erro ao registrar visualização: status ${response.status}`);
            } else {
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


    // ===============================================
// ===============================================
// Lógica da Demonstração - Teste de Monitoramento
// ===============================================

 const testForm = document.getElementById("testMonitoringForm");
    const uploadBox = document.getElementById("pdfUploadBox");
    const pdfInput = document.getElementById("pdfFile");
    const keywordInput = document.getElementById("keyword");
   
    // Caso os elementos não existam (para evitar erros)
    if (!uploadBox || !pdfInput || !testForm) return;

    // ========= Proteção para não usar mais de uma vez =========
    if (localStorage.getItem("demoUsed") === "true") {
        const analyzeButton = document.querySelector(".btn-analisar-ia");
        if (analyzeButton) {
            analyzeButton.disabled = true;
            analyzeButton.innerHTML = '<i class="fas fa-lock"></i> Demonstração já utilizada';
        }
    }

    // Permite clicar na área para selecionar o arquivo
    uploadBox.addEventListener("click", () => pdfInput.click());

    // Mostra o nome do arquivo quando for selecionado
    pdfInput.addEventListener("change", () => {
        if (pdfInput.files.length > 0) {
            const fileName = pdfInput.files[0].name;
            uploadBox.querySelector(".upload-text").textContent = fileName;
        } else {
            uploadBox.querySelector(".upload-text").textContent = "Clique aqui ou arraste seu PDF";
        }
    });

    // Suporte a "arrastar e soltar" (drag & drop)
    uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.classList.add("drag-over");
    });

    uploadBox.addEventListener("dragleave", () => {
        uploadBox.classList.remove("drag-over");
    });

    uploadBox.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadBox.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            pdfInput.files = e.dataTransfer.files;
            uploadBox.querySelector(".upload-text").textContent = file.name;
        } else {
            alert("Por favor, envie apenas arquivos PDF.");
        }
    });

    // Submissão do formulário de teste
    testForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Bloqueio local
        if (localStorage.getItem("demoUsed") === "true") {
            alert("⚠️ Você já usou sua demonstração gratuita. Crie uma conta para continuar usando o Conecta Edital.");
            return;
        }

        const pdfFile = pdfInput.files[0];
        const keyword = keywordInput?.value.trim();
        const email = emailInput?.value.trim();

        if (!pdfFile || !keyword || !email) {
            alert("Por favor, envie um PDF e preencha todos os campos.");
            return;
        }

        const formData = new FormData();
        formData.append("pdf_file", pdfFile);
        formData.append("keyword", keyword);
        formData.append("email", email);

        const analyzeButton = testForm.querySelector(".btn-analisar-ia");
        const originalText = analyzeButton.innerHTML;
        analyzeButton.disabled = true;
        analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';

        try {
            const response = await fetch(`${BACKEND_URL}/api/test-monitoring`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || "✅ Análise concluída! Verifique seu e-mail.");
                localStorage.setItem("demoUsed", "true");
                analyzeButton.innerHTML = '<i class="fas fa-lock"></i> Demonstração já utilizada';
                testForm.reset();
                uploadBox.querySelector(".upload-text").textContent = "Clique aqui ou arraste seu PDF";
            } else {
                alert(result.detail || "❌ Erro ao processar o teste de monitoramento.");
            }
        } catch (error) {
            console.error("Erro ao enviar o teste:", error);
            alert("⚠️ Falha de conexão com o servidor. Tente novamente.");
        } finally {
            analyzeButton.disabled = true; // bloqueia mesmo depois
            analyzeButton.innerHTML = '<i class="fas fa-lock"></i> Demonstração já utilizada';
        }
    });




});