// suporte.js

document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "http://127.0.0.1:8000";

    const createTicketModal = document.getElementById('create-ticket-modal');
    const openNewChamadoBtn = document.querySelector('#open-new-chamado-btn');
    const createTicketForm = document.getElementById('create-ticket-form');
    const createTicketSubmitBtn = document.getElementById('create-ticket-submit-btn');

    const ticketSubject = document.getElementById('ticket-subject');
    const ticketDescription = document.getElementById('ticket-description');
    const ticketsListContainer = document.getElementById('tickets-list-container');
    const noTicketsMessage = document.getElementById('no-tickets-message');

    const ticketDetailModal = document.getElementById('ticket-detail-modal');
    const ticketDetailTitle = document.getElementById('ticket-detail-title');
    const ticketDetailCreatedAt = document.getElementById('ticket-detail-created-at');
    const ticketDetailStatusTag = document.getElementById('ticket-detail-status-tag');
    const ticketMessagesContainer = document.getElementById('ticket-messages-container');
    const replyMessageInput = document.getElementById('reply-message-input');
    const sendReplyBtn = document.getElementById('send-reply-btn');
    
    // Elementos de filtro e busca customizados
    const ticketSearchInput = document.getElementById('ticket-search');
    const statusToggle = document.getElementById('status-toggle');
    const statusMenu = document.getElementById('status-menu');
    const statusDisplay = document.getElementById('status-display');
    const categoryToggle = document.getElementById('category-toggle');
    const categoryMenu = document.getElementById('category-menu');
    const categoryDisplay = document.getElementById('category-display');
    const sortToggle = document.getElementById('sort-toggle');
    const sortMenu = document.getElementById('sort-menu');
    const sortDisplay = document.getElementById('sort-display');

    let currentUserTickets = [];
    let currentOpenTicketId = null;

    // Função auxiliar para normalizar strings (remover acentos, espaços, etc.)
    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/--+/g, '-')
                  .trim();
    }

    // --- Funções de Modal ---
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden';
            if (modalElement === createTicketModal) {
                createTicketForm.reset();
            }
            if (modalElement === ticketDetailModal) {
                replyMessageInput.value = '';
            }
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            const anyModalOpen = document.querySelector('.modal-overlay.show-modal');
            if (!anyModalOpen) {
                document.body.style.overflow = '';
            }
            if (modalElement === ticketDetailModal) {
                currentOpenTicketId = null;
            }
        }
    }

    document.querySelectorAll('.modal-close-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modalId;
            const modalToClose = document.getElementById(modalId);
            closeModal(modalToClose);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // --- Funções de Autenticação e Carregamento de Tickets ---
    async function getAuthToken() {
        const user = window.firebase.auth().currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    async function loadTicketsForCurrentUser() {
        if (ticketsListContainer) {
            ticketsListContainer.innerHTML = '<p class="loading-message" style="text-align: center;">Carregando tickets...</p>';
            noTicketsMessage.style.display = 'none';
        }
        
        const token = await getAuthToken();
        if (!token) {
            ticketsListContainer.innerHTML = '';
            noTicketsMessage.style.display = 'flex';
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/tickets`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Erro ${response.status}: ${text}`);
            }
            currentUserTickets = await response.json();
            
            applyFiltersAndSort();
        } catch (error) {
            console.error("Erro ao carregar tickets do usuário:", error);
            ticketsListContainer.innerHTML = '<p class="error-message">Erro ao carregar tickets. Tente novamente.</p>';
            noTicketsMessage.style.display = 'none';
        }
    }

    // --- Lógica de Filtros e Ordenação ---
    function applyFiltersAndSort() {
        let filteredTickets = [...currentUserTickets];
        
        // Aplica filtro de busca (texto)
        const searchTerm = normalizeString(ticketSearchInput.value);
        if (searchTerm) {
            filteredTickets = filteredTickets.filter(ticket =>
                normalizeString(ticket.subject).includes(searchTerm) ||
                normalizeString(ticket.id).includes(searchTerm) ||
                (ticket.messages && ticket.messages.some(msg => normalizeString(msg.text).includes(searchTerm)))
            );
        }

        // Aplica filtro de status
        const selectedStatus = statusMenu.querySelector('.dropdown-option.active').dataset.value;
        if (selectedStatus !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => normalizeString(ticket.status) === normalizeString(selectedStatus));
        }

        // Aplica filtro de categoria
        const selectedCategory = categoryMenu.querySelector('.dropdown-option.active').dataset.value;
        if (selectedCategory !== 'all') {
            const normalizedCategory = normalizeString(selectedCategory);
            filteredTickets = filteredTickets.filter(ticket => normalizeString(ticket.subject).includes(normalizedCategory));
        }

        // Aplica ordenação
        const sortOrder = sortMenu.querySelector('.dropdown-option.active').dataset.value;
        if (sortOrder === 'recent') {
            filteredTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortOrder === 'oldest') {
            filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortOrder === 'status') {
            filteredTickets.sort((a, b) => a.status.localeCompare(b.status));
        }

        renderTickets(filteredTickets);
    }
    
    function renderTickets(ticketsToRender) {
        if (ticketsListContainer) {
            ticketsListContainer.innerHTML = '';
            if (ticketsToRender.length === 0) {
                noTicketsMessage.style.display = 'flex';
            } else {
                noTicketsMessage.style.display = 'none';
                ticketsToRender.forEach(ticket => {
                    const ticketCard = document.createElement('div');
                    ticketCard.classList.add('ticket-item-card');
                    const formattedDate = new Date(ticket.created_at).toLocaleString('pt-BR');
                    const statusClass = normalizeString(ticket.status);
                    const assignee = ticket.assignee || 'Não Atribuído';
                    ticketCard.innerHTML = `
                        <div class="ticket-header">
                            <span class="ticket-id">Ticket #${ticket.id.substring(0, 8)}</span>
                            <button class="btn-view-ticket" data-ticket-id="${ticket.id}">Ver Ticket <i class="fas fa-arrow-right"></i></button>
                        </div>
                        <h4 class="ticket-title">${ticket.subject}</h4>
                        <p class="ticket-date">Data de criação: ${formattedDate}</p>
                        <div class="ticket-meta">
                            <span class="ticket-status status-${statusClass}"><i class="fas fa-info-circle"></i> Status: ${ticket.status}</span>
                            <span class="ticket-assignee"><i class="fas fa-user-circle"></i> ${assignee}</span>
                        </div>
                    `;
                    ticketsListContainer.appendChild(ticketCard);
                });
                ticketsListContainer.querySelectorAll('.btn-view-ticket').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ticketId = e.currentTarget.dataset.ticketId;
                        openTicketDetailModal(ticketId);
                    });
                });
            }
        }
    }

    function openTicketDetailModal(ticketId) {
        const ticket = currentUserTickets.find(t => t.id === ticketId);
        if (!ticket) {
            console.error('Ticket não encontrado:', ticketId);
            return;
        }

        currentOpenTicketId = ticketId;
        ticketDetailTitle.textContent = `#${ticket.id.substring(0, 8)} - ${ticket.subject}`;
        const formattedDate = new Date(ticket.created_at).toLocaleString('pt-BR');
        ticketDetailCreatedAt.textContent = `Criado em: ${formattedDate}`;
        ticketDetailStatusTag.textContent = ticket.status;
        ticketDetailStatusTag.className = 'ticket-status-tag';
        ticketDetailStatusTag.classList.add(`status-${normalizeString(ticket.status)}`);

        ticketMessagesContainer.innerHTML = '';
        ticket.messages.forEach(message => {
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble', message.sender === 'user' ? 'sent' : 'received');
            const formattedMsgDate = new Date(message.timestamp).toLocaleString('pt-BR');
            
            let attachmentsHtml = '';
            if (message.attachments && message.attachments.length > 0) {
                 attachmentsHtml = '<p class="attachment-text">Anexo enviado.</p>';
            }

            messageBubble.innerHTML = `
                <span class="message-sender">${message.sender === 'user' ? 'Você' : 'Suporte'}</span>
                <span class="message-text">${message.text}</span>
                ${attachmentsHtml}
                <span class="message-timestamp">${formattedMsgDate}</span>
            `;
            ticketMessagesContainer.appendChild(messageBubble);
        });
        ticketMessagesContainer.scrollTop = ticketMessagesContainer.scrollHeight;

        openModal(ticketDetailModal);
    }
    
    // --- Lógica de Envio de Mensagem de Resposta (corrigido para exibição instantânea) ---
    async function addReplyToTicket() {
        const messageText = replyMessageInput.value.trim();

        if (!messageText) {
            alert('Por favor, digite uma mensagem para enviar.');
            return;
        }
        if (!currentOpenTicketId) {
            console.error('Nenhum ticket aberto para adicionar resposta.');
            return;
        }

        const originalButtonHtml = sendReplyBtn.innerHTML;
        sendReplyBtn.disabled = true;
        sendReplyBtn.textContent = 'Enviando...';

        const ticketToUpdate = currentUserTickets.find(t => t.id === currentOpenTicketId);
        if (!ticketToUpdate) {
            console.error('Ticket não encontrado na lista local.');
            sendReplyBtn.disabled = false;
            sendReplyBtn.innerHTML = originalButtonHtml;
            return;
        }

        const newMessage = {
            sender: 'user',
            text: messageText,
            timestamp: new Date().toISOString(),
            attachments: []
        };
        ticketToUpdate.messages.push(newMessage);
        
        openTicketDetailModal(currentOpenTicketId);
        replyMessageInput.value = '';

        const token = await getAuthToken();
        if (!token) {
            alert('Você precisa estar logado para responder a um ticket.');
            sendReplyBtn.disabled = false;
            sendReplyBtn.innerHTML = originalButtonHtml;
            ticketToUpdate.messages.pop();
            openTicketDetailModal(currentOpenTicketId);
            return;
        }

        const replyData = { text: messageText };

        try {
            const response = await fetch(`${BACKEND_URL}/api/tickets/${currentOpenTicketId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(replyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Resposta enviada com sucesso para o backend.');

            await loadTicketsForCurrentUser();

        } catch (error) {
            console.error('Erro ao enviar resposta:', error);
            alert(`Erro ao enviar resposta: ${error.message || 'Ocorreu um erro inesperado.'}`);
            ticketToUpdate.messages.pop();
            openTicketDetailModal(currentOpenTicketId);
        } finally {
            sendReplyBtn.disabled = false;
            sendReplyBtn.innerHTML = originalButtonHtml;
        }
    }


    // --- Lógica de Criação de Ticket ---
    if (createTicketForm) {
        createTicketForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!ticketSubject.value.trim()) {
                alert('Por favor, preencha o assunto do ticket.');
                ticketSubject.focus();
                return;
            }
            if (!ticketDescription.value.trim()) {
                alert('Por favor, preencha a descrição do problema.');
                ticketDescription.focus();
                return;
            }

            createTicketSubmitBtn.disabled = true;
            createTicketSubmitBtn.textContent = 'Enviando...';
            
            const token = await getAuthToken();
            if (!token) {
                alert('Você precisa estar logado para criar um ticket.');
                createTicketSubmitBtn.disabled = false;
                createTicketSubmitBtn.textContent = 'Criar Ticket';
                return;
            }

            const newTicketData = {
                subject: ticketSubject.value.trim(),
                initial_message: ticketDescription.value.trim()
            };

            try {
                const response = await fetch(`${BACKEND_URL}/api/tickets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(newTicketData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const createdTicket = await response.json();
                console.log('Ticket criado com sucesso:', createdTicket);

                alert('Ticket criado com sucesso! Em breve você receberá um e-mail de confirmação.');

                await loadTicketsForCurrentUser();
                closeModal(createTicketModal);
                
            } catch (error) {
                console.error('Erro ao criar ticket:', error);
                alert(`Erro ao criar ticket: ${error.message || 'Ocorreu um erro inesperado.'}`);
            } finally {
                createTicketSubmitBtn.disabled = false;
                createTicketSubmitBtn.textContent = 'Criar Ticket';
            }
        });
    }

    // --- Listeners para Interação com a Interface ---
    if (sendReplyBtn) {
        sendReplyBtn.addEventListener('click', addReplyToTicket);
    }
    
    if (replyMessageInput) {
        replyMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addReplyToTicket();
            }
        });
    }
    
    // Listeners para os filtros customizados
    function setupFilterListeners() {
        ticketSearchInput.addEventListener('input', applyFiltersAndSort);

        statusToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            statusMenu.classList.toggle('show');
            statusToggle.classList.toggle('active');
            categoryMenu.classList.remove('show');
            categoryToggle.classList.remove('active');
            sortMenu.classList.remove('show');
            sortToggle.classList.remove('active');
        });
        categoryToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryMenu.classList.toggle('show');
            categoryToggle.classList.toggle('active');
            statusMenu.classList.remove('show');
            statusToggle.classList.remove('active');
            sortMenu.classList.remove('show');
            sortToggle.classList.remove('active');
        });
        sortToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('show');
            sortToggle.classList.toggle('active');
            statusMenu.classList.remove('show');
            statusToggle.classList.remove('active');
            categoryMenu.classList.remove('show');
            categoryToggle.classList.remove('active');
        });

        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const menu = e.target.closest('.dropdown-menu');
                const filterType = e.target.dataset.filter;
                
                menu.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('active'));
                
                e.target.classList.add('active');
                
                const displaySpan = document.getElementById(`${filterType}-display`);
                displaySpan.textContent = e.target.textContent;
                
                menu.classList.remove('show');
                const toggleButton = document.getElementById(`${filterType}-toggle`);
                toggleButton.classList.remove('active');
                
                applyFiltersAndSort();
            });
        });
        
        window.addEventListener('click', (e) => {
            if (!statusToggle.contains(e.target) && !statusMenu.contains(e.target)) {
                statusMenu.classList.remove('show');
                statusToggle.classList.remove('active');
            }
            if (!categoryToggle.contains(e.target) && !categoryMenu.contains(e.target)) {
                categoryMenu.classList.remove('show');
                categoryToggle.classList.remove('active');
            }
            if (!sortToggle.contains(e.target) && !sortMenu.contains(e.target)) {
                sortMenu.classList.remove('show');
                sortToggle.classList.remove('active');
            }
        });
    }
    
    setupFilterListeners();
    
    if (typeof window.firebase !== 'undefined' && typeof window.firebase.auth !== 'undefined') {
        window.firebase.auth().onAuthStateChanged(user => {
            if (user) {
                loadTicketsForCurrentUser();
            } else {
                ticketsListContainer.innerHTML = '';
                noTicketsMessage.style.display = 'flex';
                currentUserTickets = [];
            }
        });
    } else {
        console.error("Firebase Auth não disponível. Verifique a importação do Firebase.");
    }

    if (openNewChamadoBtn) {
        openNewChamadoBtn.addEventListener('click', () => {
            openModal(createTicketModal);
        });
    }
    
    async function checkTicketsForUpdates() {
        if (!window.firebase.auth().currentUser) {
            return;
        }

        const token = await getAuthToken();
        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/tickets`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                }
            });

            if (!response.ok) {
                console.error("Erro na verificação periódica de tickets.");
                return;
            }

            const newTickets = await response.json();
            
            if (JSON.stringify(currentUserTickets) !== JSON.stringify(newTickets)) {
                console.log("Detectadas atualizações nos tickets. A lista foi recarregada.");
                currentUserTickets = newTickets;
                applyFiltersAndSort();
                
                if (ticketDetailModal.classList.contains('show-modal') && currentOpenTicketId) {
                    const updatedTicket = currentUserTickets.find(t => t.id === currentOpenTicketId);
                    if (updatedTicket) {
                        openTicketDetailModal(updatedTicket.id);
                    }
                }
            }
        } catch (error) {
            console.error("Erro durante a verificação de atualizações:", error);
        }
    }

    setInterval(checkTicketsForUpdates, 5000);
});