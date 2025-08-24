// ajuda.js

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const suggestionButtons = document.querySelectorAll('.suggestion-button'); 

    // IMPORTANTE: Para testes LOCALMENTE, sua chave de API foi inserida aqui.
    // Quando você for implantar isso em um ambiente de produção ou no próprio ambiente Canvas,
    // você DEVE remover a sua chave de API diretamente do código por segurança.
    const API_KEY = "AIzaSyDdc58E9UU-By8hKQOYPRhuR1arEZT2JTg"; 
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=";

    // Contexto do site para a IA (Base de Conhecimento)
    // Isso será enviado para a IA para que ela possa responder com base nessas informações.
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

    // Array para armazenar o histórico de mensagens para persistência
    let persistedChatHistory = [];

    // Função para remover a formatação Markdown e substituir por negrito HTML
    function formatMarkdown(text) {
        // CORREÇÃO: Usa uma regex para substituir **texto** por <strong>texto</strong>
        // Isso garante que apenas o conteúdo entre os asteriscos seja formatado.
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return formattedText;
    }

    // Função para adicionar uma mensagem ao chat UI e ao histórico persistente
    function addMessage(sender, text, save = true) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        
        // CORREÇÃO: Aplica a função de formatação antes de inserir no HTML
        messageElement.innerHTML = `<p>${formatMarkdown(text)}</p>`;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (save) {
            persistedChatHistory.push({ sender, text });
            saveChatHistory();
        }
    }

    // Função para exibir/ocultar o indicador de carregamento
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

    // Função para enviar a pergunta para a IA
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
            const apiKey = API_KEY; 
            const apiUrl = API_URL + apiKey;

            if (!apiKey) {
                throw new Error("API Key não configurada. A Conectinha não pode se comunicar com a IA.");
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

    // Listeners de Eventos
    sendButton.addEventListener('click', () => {
        const question = userInput.value.trim();
        if (question) {
            sendQuestionToAI(question);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const question = userInput.value.trim();
            if (question) {
                sendQuestionToAI(question);
            }
        }
    });

    const faqItems = document.querySelectorAll('.faq-item');

    function getFaqViews(faqId, initialHtmlViews) {
        const storedViews = localStorage.getItem(`faq_views_${faqId}`);
        if (storedViews !== null) {
            return parseInt(storedViews);
        }
        localStorage.setItem(`faq_views_${faqId}`, initialHtmlViews);
        return initialHtmlViews;
    }

    faqItems.forEach(item => {
        const faqId = item.dataset.id;
        const viewsSpanElement = item.querySelector('.views-counter');
        const viewsCountTextNode = viewsSpanElement ? viewsSpanElement.querySelector('.fa-eye').nextSibling : null;

        if (faqId && viewsCountTextNode) {
            let initialViewsString = viewsCountTextNode.textContent.trim().split(' ')[0];
            let initialViews = parseInt(initialViewsString) || 0;
            let currentViews = getFaqViews(faqId, initialViews);
            viewsCountTextNode.textContent = ` ${currentViews} visualizações`;
        }
    });

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const faqId = item.dataset.id;
        const viewsSpanElement = item.querySelector('.views-counter');
        const viewsCountTextNode = viewsSpanElement ? viewsSpanElement.querySelector('.fa-eye').nextSibling : null;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = '0px';
                }
            });

            if (isActive) {
                item.classList.remove('active');
                if (answer) answer.style.maxHeight = '0px';
            } else {
                item.classList.add('active');
                if (answer) answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
                if (viewsCountTextNode && faqId) {
                    let currentViewsString = viewsCountTextNode.textContent.trim().split(' ')[0];
                    let currentViews = parseInt(currentViewsString);
                    if (!isNaN(currentViews)) {
                        currentViews++;
                        viewsCountTextNode.textContent = ` ${currentViews} visualizações`;
                        localStorage.setItem(`faq_views_${faqId}`, currentViews);
                    }
                }
            }
        });
    });

    const filterButtons = document.querySelectorAll('.filter-btn');
    const allFaqItems = document.querySelectorAll('.faq-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterCategory = button.dataset.filter;

            allFaqItems.forEach(item => {
                const itemCategories = item.dataset.category ? item.dataset.category.split(' ') : [];
                if (filterCategory === 'todos') {
                    item.style.display = 'block';
                } else {
                    if (itemCategories.includes(filterCategory)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            allFaqItems.forEach(item => {
                const questionText = item.querySelector('.faq-question h3').textContent.toLowerCase();
                const answerText = item.querySelector('.faq-answer p').textContent.toLowerCase();
                const itemCategories = item.dataset.category ? item.dataset.category.split(' ') : [];
                const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;

                const categoryMatch = activeFilter === 'todos' || itemCategories.includes(activeFilter);
                const searchMatch = !searchTerm || questionText.includes(searchTerm) || answerText.includes(searchTerm);

                if (categoryMatch && searchMatch) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    if (typeof window.firebase !== 'undefined' && typeof window.firebase.auth !== 'undefined') {
        window.firebase.auth().onAuthStateChanged(user => {
            if (user) {
                loadChatHistory();
            } else {
                window.clearChatHistory();
            }
        });
    }
});