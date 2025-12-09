document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const suggestionButtons = document.querySelectorAll('.suggestion-button');

    // Referências aos elementos do FAQ
    const faqListContainer = document.getElementById('faq-list-container');
    const searchFaqInput = document.querySelector('.search-bar input');
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    
   

    // FUNÇÃO AUXILIAR: Normaliza a string para comparação
    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // --- Lógica do Chatbot ---
    const API_URL = `${BACKEND_URL}/chat`;

    const SITE_CONTEXT = `
        Você é a Conectinha, a assistente de IA do Conecta Edital. Sua função é ajudar usuários com dúvidas sobre a plataforma.
        Responda de forma amigável, concisa e informativa, usando apenas as informações fornecidas. Se a pergunta estiver fora do seu conhecimento, diga que não tem essa informação.

        **Nome da Plataforma:** Conecta Edital
        **Propósito:** Monitoramento de editais e concursos públicos. Ajuda candidatos a não perderem nomeações, convocações e atualizações importantes.

        **Tipos de Monitoramento:**
        - **Pessoal:** Monitoramento de um candidato específico em um edital/concurso. Palavras-chave: nome do candidato, ID do edital.
        - **Radar:** Monitoramento de um edital/concurso específico. Palavras-chave: ID do edital.

        **Planos:**
        - **Sem Plano (Gratuito):** 0 slots de monitoramento. Não permite criar novos monitoramentos. Acesso limitado.
        - **Plano Essencial:** 3 slots de monitoramento. Verificação automática diária. Notificações por e-mail. Histórico de publicações (30 dias). Dashboard amplificado. Suporte técnico via ticket.
        - **Plano Premium:** Monitoramentos ILIMITADOS. Verificação em TEMPO REAL (a cada hora). Notificações por Email e WhatsApp. Suporte PRIORITÁRIO 24/7. Histórico COMPLETO e ilimitado. Alertas personalizados AVANÇADOS. Backup automático de todos os dados. Monitoramento aprimorado com IA. Acesso antecipado a novas funcionalidades.

        **Recursos/Diferenciais:**
        - Monitoramento de Precisão com IA (varre Diários Oficiais e sites de bancas 24/7).
        - Alertas Instantâneos (email ou WhatsApp).
        - Foco Total nos Estudos (deixa o acompanhamento de publicações para a plataforma).

        **Como criar um monitoramento:**
        1. Faça login no seu painel do Conecta Edital.
        2. Clique no botão "+ Novo Monitoramento".
        3. Escolha o tipo de monitoramento (Pessoal ou Radar).
        4. Preencha os dados necessários (link do diário oficial, ID do edital, e nome do candidato se for Pessoal).
        5. Confirme a criação.

        **Exemplos de perguntas e respostas (para entender o tom):**
        - "Qual a diferença entre monitoramento Pessoal e Radar?" -> "O monitoramento Pessoal foca em um candidato específico dentro de um edital, enquanto o Radar monitora apenas o edital em si, sem focar em um nome."
        - "Como faço para monitorar meu nome?" -> "Para monitorar seu nome, você deve criar um monitoramento do tipo Pessoal. Nele, você informará seu nome completo e o ID do edital."
        - "Quantos monitoramentos posso ter no Plano Essencial?" -> "No Plano Essencial, você pode ter até 3 monitoramentos simultâneos."
        - "O que é o Conecta Edital?" -> "O Conecta Edital é uma plataforma de monitoramento de editais e concursos públicos, que te ajuda a não perder nenhuma atualização importante da sua jornada de concurseiro."
        - "Vocês monitoram Diários Oficiais?" -> "Sim, a Conectinha e nossa IA varrem Diários Oficiais e sites de bancas 24/7 para você."
    `;

    let persistedChatHistory = [];

    function formatMarkdown(text) {
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return formattedText;
    }

    function addMessage(sender, text, save = true) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerHTML = `<p>${formatMarkdown(text)}</p>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (save) {
            persistedChatHistory.push({ sender, text });
            saveChatHistory();
        }
    }

    function showLoadingIndicator(show) {
        let loadingElement = document.getElementById('loading-indicator');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading-indicator';
            loadingElement.classList.add('loading-indicator', 'received');
            loadingElement.innerHTML = `
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            `;
            chatMessages.appendChild(loadingElement);
        }
        loadingElement.style.display = show ? 'flex' : 'none';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendQuestionToAI(question) {
        addMessage('sent', question);
        userInput.value = '';
        showLoadingIndicator(true);

        try {
            let chatHistoryForAPI = [{ role: "user", parts: [{ text: SITE_CONTEXT }] }];
            persistedChatHistory.forEach(msg => {
                chatHistoryForAPI.push({ role: msg.sender === 'sent' ? 'user' : 'model', parts: [{ text: msg.text }] });
            });
            chatHistoryForAPI.push({ role: "user", parts: [{ text: question }] });
            
            const payload = { contents: chatHistoryForAPI };
            const apiUrl = API_URL;

const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: chatHistoryForAPI
    })
});



            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro da API Gemini:", errorData);
                throw new Error(`Erro ao se comunicar com a IA: ${errorData.error.message || 'Erro desconhecido.'}`);
            }

            const result = await response.json();
            let aiResponseText = "Desculpe, não consegui gerar uma resposta no momento. Por favor, tente novamente.";

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.warn("Estrutura de resposta inesperada da API Gemini:", result);
            }
            
            addMessage('received', aiResponseText);

        } catch (error) {
            console.error("Erro ao enviar pergunta para a IA:", error);
            addMessage('received', `Desculpe, houve um erro ao processar sua pergunta: ${error.message}.`);
        } finally {
            showLoadingIndicator(false);
        }
    }

    // --- Funções de Persistência do Chat ---
    function getChatHistoryKey() {
        const user = window.auth.currentUser;
        const key = user ? `user_chat_history_${user.uid}` : 'guest_chat_history';
        return key;
    }

    window.loadChatHistory = function() {
        const storedHistory = localStorage.getItem(getChatHistoryKey());
        if (storedHistory) {
            persistedChatHistory = JSON.parse(storedHistory);
            chatMessages.innerHTML = '';
            persistedChatHistory.forEach(msg => {
                addMessage(msg.sender, msg.text, false);
            });
        } else {
            chatMessages.innerHTML = '';
            addMessage('received', 'Olá! 👋 Eu sou a Conectinha, sua assistente virtual do Conecta Edital! Posso te ajudar com dúvidas sobre monitoramentos, planos, funcionalidades e muito mais. Como posso te ajudar hoje?', false);
        }
    }

    function saveChatHistory() {
        localStorage.setItem(getChatHistoryKey(), JSON.stringify(persistedChatHistory));
    }

    window.clearChatHistory = function() {
        const keyToClear = getChatHistoryKey();
        localStorage.removeItem(keyToClear);
        persistedChatHistory = [];
        chatMessages.innerHTML = '';
        addMessage('received', 'Olá! 👋 Eu sou a Conectinha, sua assistente virtual do Conecta Edital! Posso te ajudar com dúvidas sobre monitoramentos, planos, funcionalidades e muito mais. Como posso te ajudar hoje?', false);
    };

    if (typeof window.auth !== 'undefined') {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                loadChatHistory();
            } else {
                window.clearChatHistory();
            }
        });
    } else {
        console.warn("Firebase Auth (window.auth) não disponível.");
        loadChatHistory();
    }

    // Listeners de Eventos do Chatbot
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const question = userInput.value.trim();
            if (question) {
                sendQuestionToAI(question);
            }
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const question = userInput.value.trim();
                if (question) {
                    sendQuestionToAI(question);
                }
            }
        });
    }
    
    // --- Lógica do FAQ (NOVO) ---
    let allFaqs = [];

    // NOVO: Função para registrar a visualização no backend
    async function recordFaqView(faqId) {
        try {
            await fetch(`${BACKEND_URL}/faq/${faqId}/visualizacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log(`Visualização registrada para o FAQ: ${faqId}`);
        } catch (error) {
            console.error("Erro ao registrar visualização:", error);
        }
    }

    // Função para buscar os FAQs do backend
    async function fetchAndRenderFaqs() {
        if (!faqListContainer) return;
        faqListContainer.innerHTML = '<p class="loading-message">Carregando perguntas frequentes...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/faq`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allFaqs = await response.json();

            // LÓGICA DE ORDENAÇÃO: Coloca as perguntas populares no topo
            allFaqs.sort((a, b) => {
                if (a.popular && !b.popular) return -1; // a vem antes de b
                if (!a.popular && b.popular) return 1; // b vem antes de a
                return 0; // mantém a ordem relativa
            });

            renderFaqs(allFaqs);
        } catch (error) {
            console.error("Erro ao carregar FAQs:", error);
            faqListContainer.innerHTML = '<p class="error-message">Erro ao carregar perguntas frequentes. Por favor, tente novamente.</p>';
        }
    }

    function renderFaqs(faqsToRender) {
        if (!faqListContainer) return;
        faqListContainer.innerHTML = '';
        if (faqsToRender.length === 0) {
            faqListContainer.innerHTML = '<p class="no-results-message">Nenhuma pergunta encontrada.</p>';
            return;
        }
        faqsToRender.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.classList.add('faq-item');
            
            const popularTagHtml = faq.popular ? `<span class="popular-tag"><i class="fas fa-fire"></i> Pergunta popular</span>` : '';
            
            const normalizedCategory = faq.categoria ? normalizeString(faq.categoria) : '';
            faqItem.dataset.category = normalizedCategory;
            faqItem.dataset.id = faq.id;

            const iconClass = faq.popular ? 'popular-icon-bg' : 'help-icon-bg';
            const iconElement = faq.popular ? '<i class="fas fa-fire"></i>' : '<i class="fas fa-question-circle"></i>';

            faqItem.innerHTML = `
                <div class="faq-question">
                    <div class="faq-icon-wrapper ${iconClass}">${iconElement}</div>
                    <h3>${faq.pergunta}</h3>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-meta">
                    <span class="views-counter" data-faq-id="${faq.id}"><i class="fas fa-eye eye-personal"></i> ${faq.visualizacoes} visualizações</span>
                    ${popularTagHtml}
                </div>
                <div class="faq-answer">
                    <p>${faq.resposta}</p>
                </div>
            `;
            faqListContainer.appendChild(faqItem);
        });

        attachAccordionListeners();
    }

    function attachAccordionListeners() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0';
                });

                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
                    
                    const faqId = item.dataset.id;
                    if (faqId) {
                        recordFaqView(faqId);
                        const viewsSpan = item.querySelector('.faq-meta .views-counter');
                        let currentViews = parseInt(viewsSpan.textContent.match(/\d+/)[0]);
                        viewsSpan.innerHTML = `<i class="fas fa-eye eye-personal"></i> ${currentViews + 1} visualizações`;
                    }
                }
            });
        });
    }

    function filterFaqs() {
        const searchTerm = searchFaqInput ? normalizeString(searchFaqInput.value) : '';
        const activeFilterBtn = document.querySelector('.filter-buttons .filter-btn.active');
        const activeCategory = activeFilterBtn ? activeFilterBtn.dataset.filter : 'todos';

        const filteredFaqs = allFaqs.filter(faq => {
            const matchesSearch = !searchTerm || normalizeString(faq.pergunta).includes(searchTerm) || normalizeString(faq.resposta).includes(searchTerm);
            const matchesCategory = activeCategory === 'todos' || normalizeString(faq.categoria) === activeCategory;
            return matchesSearch && matchesCategory;
        });

        renderFaqs(filteredFaqs);
    }

    if (searchFaqInput) {
        searchFaqInput.addEventListener('input', filterFaqs);
    }
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterFaqs();
            });
        });
    }

    fetchAndRenderFaqs();
}); 