document.addEventListener('DOMContentLoaded', async () => {
    console.log("admin.js: Script carregado e DOM content loaded.");

    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";
    
    // Removido: A variável 'token' foi removida para desabilitar a autenticação no painel de admin.

    // --- FUNÇÃO AUXILIAR PARA CALCULAR TEMPO DE LEITURA ---
    function calcularTempoDeLeitura(texto) {
        const palavrasPorMinuto = 100;
        const numeroDePalavras = texto.split(/\s+/).length;
        return Math.ceil(numeroDePalavras / palavrasPorMinuto);
    }
    // --- FIM DA FUNÇÃO AUXILIAR ---

    let allUsers = [];
    let allTickets = [];
    let currentViewingTicket = null;
    let allDicas = [];
    let allFaqs = [];
    let allArticles = [];

    const totalUsersPlansSpan = document.getElementById('total-users-plans');
    const noPlanPercentageSpan = document.getElementById('no-plan-percentage');
    const noPlanValueSpan = document.getElementById('no-plan-value');
    const noPlanProgressBar = document.querySelector('.progress-bar.no-plan-bar');
    const essencialPercentageSpan = document.getElementById('essencial-percentage');
    const essencialValueSpan = document.getElementById('essencial-value');
    const essencialProgressBar = document.querySelector('.progress-bar.essencial-bar');
    const premiumPercentageSpan = document.getElementById('premium-percentage');
    const premiumValueSpan = document.getElementById('premium-value');
    const premiumProgressBar = document.querySelector('.progress-bar.premium-bar');
    const totalSlotsUsersSpan = document.getElementById('total-slots-users');
    const zeroSlotsPercentageSpan = document.getElementById('zero-slots-percentage');
    const zeroSlotsValueSpan = document.getElementById('zero-slots-value');
    const zeroSlotsProgressBar = document.querySelector('.progress-bar.zero-slots-bar');
    const oneTwoSlotsPercentageSpan = document.getElementById('one-two-slots-percentage');
    const oneTwoSlotsValueSpan = document.getElementById('one-two-slots-value');
    const oneTwoSlotsProgressBar = document.querySelector('.progress-bar.one-two-slots-bar');
    const threeFiveSlotsPercentageSpan = document.getElementById('three-five-slots-percentage');
    const threeFiveSlotsValueSpan = document.getElementById('three-five-slots-value');
    const threeFiveSlotsProgressBar = document.querySelector('.progress-bar.three-five-slots-bar');
    const sixPlusSlotsPercentageSpan = document.getElementById('six-plus-slots-percentage');
    const sixPlusSlotsValueSpan = document.getElementById('six-plus-slots-value');
    const sixPlusSlotsProgressBar = document.querySelector('.progress-bar.six-plus-slots-bar');
    const totalStatusUsersSpan = document.getElementById('total-status-users');
    const activeUsersPercentageSpan = document.getElementById('active-users-percentage');
    const activeUsersValueSpan = document.getElementById('active-users-value');
    const activeUsersProgressBar = document.querySelector('.progress-bar.active-users-bar');
    const inactiveUsersPercentageSpan = document.getElementById('inactive-users-percentage');
    const inactiveUsersValueSpan = document.getElementById('inactive-users-value');
    const inactiveUsersProgressBar = document.querySelector('.progress-bar.inactive-users-bar');
    
    const viewTicketsBtn = document.getElementById('view-tickets-btn');
    const allTicketsModal = document.getElementById('all-tickets-modal');
    const ticketsListAdmin = document.getElementById('tickets-list-admin');
    const ticketDetailId = document.getElementById('ticket-detail-id');
    const ticketDetailTitle = document.getElementById('ticket-detail-title');
    const ticketDetailCreatedAt = document.getElementById('ticket-detail-created-at');
    const ticketDetailStatusTag = document.getElementById('ticket-detail-status-tag');
    const ticketDetailUserEmail = document.getElementById('ticket-detail-user-email');
    const ticketDetailModal = document.getElementById('ticket-detail-modal');
    // exemplo de preenchimento
   


    const ticketMessagesContainer = document.getElementById('ticket-messages-container');
    const adminReplyMessageInput = document.getElementById('admin-reply-message-input');
    const sendAdminReplyBtn = document.getElementById('send-admin-reply-btn');
    const changeStatusSelect = document.getElementById('change-status-select');
    const auditUsersBtn = document.getElementById('audit-users-btn');
    const auditUsersModal = document.getElementById('audit-users-modal');
    const usersAuditList = document.getElementById('users-audit-list');
    const loadingAuditUsers = document.getElementById('loading-audit-users');
    const noAuditUsers = document.getElementById('no-audit-users');
    const userSearchInput = document.getElementById('user-search-input');
    
    const manageDicasBtn = document.getElementById('manage-dicas-btn');
    const dicaModal = document.getElementById('dica-modal');
    const dicaFormModal = document.getElementById('dica-form-modal');
    const openNewDicaBtn = document.getElementById('open-new-dica-btn');
    const dicasListContainer = document.getElementById('dicas-list-container');
    
    const dicaModalTitle = document.getElementById('dica-modal-title');
    const dicaForm = document.getElementById('dica-form');
    const dicaIdInput = document.getElementById('dica-id');
    const dicaTituloInput = document.getElementById('dica-titulo');
    const dicaAutorInput = document.getElementById('dica-autor');
    const dicaTopicoSelect = document.getElementById('dica-topico');
    const dicaConteudoTextarea = document.getElementById('dica-conteudo');

    const manageFaqBtn = document.getElementById('manage-faq-btn');
    const faqModal = document.getElementById('faq-modal');
    const openNewFaqBtn = document.getElementById('open-new-faq-btn');
    const faqListContainer = document.getElementById('faq-list-container');
    const faqFormModal = document.getElementById('faq-form-modal');
    const faqForm = document.getElementById('faq-form');
    const faqModalTitle = document.getElementById('faq-modal-title');
    const faqIdInput = document.getElementById('faq-id');
    const faqPerguntaInput = document.getElementById('faq-pergunta');
    const faqRespostaTextarea = document.getElementById('faq-resposta');
    const faqCategoriaSelect = document.getElementById('faq-categoria');
    const faqPopularCheckbox = document.getElementById('faq-popular');

    const ticketSearchAdminInput = document.getElementById('ticket-search-admin');

    // NOVO: Referências aos elementos do seletor customizado
    const customSelectWrapper = document.querySelector('.custom-select-wrapper');
    const selectSelected = document.getElementById('ticket-status-filter-custom');
    const selectItemsContainer = document.querySelector('.select-items');
    let ticketStatusFilterValue = selectSelected ? selectSelected.dataset.value : 'Todos';

    const viewFeedbackBtn = document.getElementById('view-feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const totalTicketsSpan = document.getElementById('total-tickets');
    const responseRateSpan = document.getElementById('response-rate');
    const avgResolutionTimeSpan = document.getElementById('avg-resolution-time');
    const satisfactionRateSpan = document.getElementById('satisfaction-rate');
    const pendingTicketsSpan = document.getElementById('pending-tickets');
    const activeUsersFeedbackSpan = document.getElementById('active-users-count');
    const totalUsersFeedbackSpan = document.getElementById('total-users-in-feedback');
    const ticketsByCategoryChartCanvas = document.getElementById('ticketsByCategoryChart');
    const ticketStatusChartCanvas = document.getElementById('ticketStatusChart');
    const monthlyTrendChartCanvas = document.getElementById('monthlyTrendChart');
    let ticketsByCategoryChart;
    let ticketStatusChart;
    let monthlyTrendChart;
    
    const manageBlogBtn = document.getElementById('manage-blog-btn');
    const blogModal = document.getElementById('blog-modal');
    const articlesListContainer = document.getElementById('articles-list-container');
    const blogFormModal = document.getElementById('blog-form-modal');
    const openNewArticleBtn = document.getElementById('open-new-article-btn');
    const blogForm = document.getElementById('blog-form');
    const blogModalTitle = document.getElementById('blog-modal-title');
    const blogIdInput = document.getElementById('blog-id');
    const blogTitleInput = document.getElementById('blog-title');
    const blogAuthorInput = document.getElementById('blog-author');
    const blogContentTextarea = document.getElementById('blog-content');

    // NOVAS REFERÊNCIAS DO MODAL DE EDIÇÃO DE USUÁRIO
    const userEditModal = document.getElementById('user-edit-modal');
    const userEditForm = document.getElementById('user-edit-form');
    const editUserUidInput = document.getElementById('edit-user-uid');
    const editUserFullnameInput = document.getElementById('edit-user-fullname');
    const editUserEmailInput = document.getElementById('edit-user-email');
    const editUserPlanSelect = document.getElementById('edit-user-plan');


    // Funções auxiliares de modal
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.classList.add('modal-open');
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            const anyModalOpen = document.querySelector('.modal-overlay.show-modal');
            if (!anyModalOpen) {
                document.body.classList.remove('modal-open');
            }
            if (modalElement === ticketDetailModal) {
                currentViewingTicket = null;
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

    // Funções da página principal (estatísticas)
    async function fetchAdminStats() {
        console.log("fetchAdminStats: Tentando buscar estatísticas do admin...");
        try {
            const response = await fetch(`${BACKEND_URL}/admin/stats`, {
                method: 'GET',
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                    "ngrok-skip-browser-warning": "true"
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stats = await response.json();
            console.log("Estatísticas do Admin recebidas:", stats);

            if (totalUsersPlansSpan) totalUsersPlansSpan.textContent = stats.total_users;
            
            if (noPlanPercentageSpan) noPlanPercentageSpan.textContent = `${stats.plan_distribution.no_plan.percentage.toFixed(1)}%`;
            if (noPlanValueSpan) noPlanValueSpan.textContent = stats.plan_distribution.no_plan.count;
            if (noPlanProgressBar) noPlanProgressBar.style.width = `${stats.plan_distribution.no_plan.percentage.toFixed(1)}%`;

            if (essencialPercentageSpan) essencialPercentageSpan.textContent = `${stats.plan_distribution.essencial.percentage.toFixed(1)}%`;
            if (essencialValueSpan) essencialValueSpan.textContent = stats.plan_distribution.essencial.count;
            if (essencialProgressBar) essencialProgressBar.style.width = `${stats.plan_distribution.essencial.percentage.toFixed(1)}%`;

            if (premiumPercentageSpan) premiumPercentageSpan.textContent = `${stats.plan_distribution.premium.percentage.toFixed(1)}%`;
            if (premiumValueSpan) premiumValueSpan.textContent = stats.plan_distribution.premium.count;
            if (premiumProgressBar) premiumProgressBar.style.width = `${stats.plan_distribution.premium.percentage.toFixed(1)}%`;

            if (totalSlotsUsersSpan) totalSlotsUsersSpan.textContent = stats.total_users;
            
            if (zeroSlotsPercentageSpan) zeroSlotsPercentageSpan.textContent = `${stats.slot_distribution.zero_slots.percentage.toFixed(1)}%`;
            if (zeroSlotsValueSpan) zeroSlotsValueSpan.textContent = stats.slot_distribution.zero_slots.count;
            if (zeroSlotsProgressBar) zeroSlotsProgressBar.style.width = `${stats.slot_distribution.zero_slots.percentage.toFixed(1)}%`;

            if (oneTwoSlotsPercentageSpan) oneTwoSlotsPercentageSpan.textContent = `${stats.slot_distribution.one_two_slots.percentage.toFixed(1)}%`;
            if (oneTwoSlotsValueSpan) oneTwoSlotsValueSpan.textContent = stats.slot_distribution.one_two_slots.count;
            if (oneTwoSlotsProgressBar) oneTwoSlotsProgressBar.style.width = `${stats.slot_distribution.one_two_slots.percentage.toFixed(1)}%`;

            if (threeFiveSlotsPercentageSpan) threeFiveSlotsPercentageSpan.textContent = `${stats.slot_distribution.three_five_slots.percentage.toFixed(1)}%`;
            if (threeFiveSlotsValueSpan) threeFiveSlotsValueSpan.textContent = stats.slot_distribution.three_five_slots.count;
            if (threeFiveSlotsProgressBar) threeFiveSlotsProgressBar.style.width = `${stats.slot_distribution.three_five_slots.percentage.toFixed(1)}%`;

            if (sixPlusSlotsPercentageSpan) sixPlusSlotsPercentageSpan.textContent = `${stats.slot_distribution.six_plus_slots.percentage.toFixed(1)}%`;
            if (sixPlusSlotsValueSpan) sixPlusSlotsValueSpan.textContent = stats.slot_distribution.six_plus_slots.count;
            if (sixPlusSlotsProgressBar) sixPlusSlotsProgressBar.style.width = `${stats.slot_distribution.six_plus_slots.percentage.toFixed(1)}%`;

            if (totalStatusUsersSpan) totalStatusUsersSpan.textContent = stats.total_users;

            if (activeUsersPercentageSpan) activeUsersPercentageSpan.textContent = `${stats.user_status_distribution.active.percentage.toFixed(1)}%`;
            if (activeUsersValueSpan) activeUsersValueSpan.textContent = stats.user_status_distribution.active.count;
            if (activeUsersProgressBar) activeUsersProgressBar.style.width = `${stats.user_status_distribution.active.percentage.toFixed(1)}%`;

            if (inactiveUsersPercentageSpan) inactiveUsersPercentageSpan.textContent = `${stats.user_status_distribution.inactive.percentage.toFixed(1)}%`;
            if (inactiveUsersValueSpan) inactiveUsersValueSpan.textContent = stats.user_status_distribution.inactive.count;
            if (inactiveUsersProgressBar) inactiveUsersProgressBar.style.width = `${stats.user_status_distribution.inactive.percentage.toFixed(1)}%`;
        } catch (error) {
            console.error("Erro ao buscar estatísticas do admin:", error);
        }
    }
    
    // Funções para gerenciamento de tickets
    async function loadAllTickets() {
        if (ticketsListAdmin) {
            ticketsListAdmin.innerHTML = '<p class="loading-tickets-message">Carregando tickets...</p>';
        }
        try {
            const response = await fetch(`${BACKEND_URL}/admin/tickets`, {
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allTickets = await response.json();
            
            // Chama a função de filtro ao carregar os tickets
            applyFilters();

        } catch (error) {
            console.error("Erro ao carregar tickets:", error);
            if (ticketsListAdmin) {
                ticketsListAdmin.innerHTML = '<p class="error-message">Erro ao carregar tickets. Tente novamente.</p>';
            }
        }
    }

    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9-]/g, '')
                .trim();
    }

    // Função para aplicar todos os filtros (busca e status)
    function applyFilters() {
        const searchTerm = ticketSearchAdminInput ? ticketSearchAdminInput.value.trim() : '';
        // NOVO: Pega o valor do seletor customizado
        const selectedStatus = ticketStatusFilterValue; 
        
        let filteredTickets = [...allTickets];
        
        // Aplica o filtro de busca
        if (searchTerm) {
            const normalizedSearchTerm = normalizeString(searchTerm);
            filteredTickets = filteredTickets.filter(ticket =>
                normalizeString(ticket.subject).includes(normalizedSearchTerm) ||
                normalizeString(ticket.id).includes(normalizedSearchTerm) ||
                (ticket.messages && ticket.messages.some(msg => normalizeString(msg.text).includes(normalizedSearchTerm)))
            );
        }

        // Aplica o filtro de status
        if (selectedStatus !== 'Todos') {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === selectedStatus);
        }
        
        renderTicketsList(filteredTickets);
    }
    
    function renderTicketsList(tickets) {
        if (ticketsListAdmin) {
            ticketsListAdmin.innerHTML = '';
    
            if (tickets.length === 0) {
                ticketsListAdmin.innerHTML = '<p class="no-tickets-message">Nenhum ticket encontrado.</p>';
                return;
            }
    
            tickets.forEach(ticket => {
                const ticketCard = document.createElement('div');
                ticketCard.classList.add('ticket-admin-card');
                
                const formattedDate = ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString('pt-BR')
                    : 'Data Desconhecida';
    
                    ticketCard.innerHTML = `
                    <div class="ticket-admin-header">
                        <h4>Ticket #${ticket.id.substring(0, 8)} - ${ticket.subject}</h4>
                        <span class="ticket-admin-status status-${ticket.status.toLowerCase().replace(/ /g, '-') || 'desconhecido'}">${ticket.status}</span>
                    </div>
                    <p class="ticket-admin-info">Criado em: ${formattedDate}</p>
                    <p class="ticket-admin-info">Por: ${ticket.user_email}</p>
                    <p class="ticket-admin-info">Atendido por: <strong>${ticket.assignee || "Não Atribuído"}</strong></p>
                    <div class="ticket-actions">
                        <button class="btn-view-ticket-admin" data-ticket-id="${ticket.id}">Ver Detalhes</button>
                        <select class="assign-ticket-select" data-ticket-id="${ticket.id}">
                            <option value="">Atribuir...</option>
                            <option value="Ronaldo" ${ticket.assignee === "Ronaldo" ? "selected" : ""}>Ronaldo</option>
                            <option value="Rafael" ${ticket.assignee === "Rafael" ? "selected" : ""}>Rafael</option>
                            <option value="Gabriel" ${ticket.assignee === "Gabriel" ? "selected" : ""}>Gabriel</option>
                        </select>
                    </div>
                `;
                
    
                ticketsListAdmin.appendChild(ticketCard);
            });
    
            // Listener do botão "Ver Detalhes"
            ticketsListAdmin.querySelectorAll('.btn-view-ticket-admin').forEach(button => {
                button.addEventListener('click', (e) => {
                    const ticketId = e.currentTarget.dataset.ticketId;
                    openTicketDetailAdminModal(ticketId);
                });
            });
    
            // Listener para atribuir tickets
            ticketsListAdmin.querySelectorAll('.assign-ticket-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const ticketId = e.target.dataset.ticketId;
                    const assignee = e.target.value;
    
                    if (!assignee) return; // nada selecionado
    
                    try {
                        const response = await fetch(`${BACKEND_URL}/admin/tickets/${ticketId}/assign`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                "ngrok-skip-browser-warning": "true"
                            },
                            body: JSON.stringify({ assignee })
                        });
    
                        if (!response.ok) {
                            throw new Error(`Erro HTTP ${response.status}`);
                        }
    
                        alert(`🎯 Ticket atribuído a ${assignee} com sucesso!`);
                        await loadAllTickets(); // recarrega lista
                    } catch (err) {
                        console.error("Erro ao atribuir ticket:", err);
                        alert("Erro ao atribuir ticket. Tente novamente.");
                    }
                });
            });
        }
    }
    

    async function openTicketDetailAdminModal(ticketId) {
        const ticket = allTickets.find(t => t.id === ticketId);
        if (!ticket) {
            console.error("Ticket não encontrado na lista local:", ticketId);
            alert("Ticket não encontrado.");
            return;
        }
    
        currentViewingTicket = ticket;
    
        // Preenche ID e título separadamente
        ticketDetailId.textContent = `#${ticket.id.substring(0, 8)}`;
        ticketDetailTitle.textContent = ticket.subject;
    
        // Status
        ticketDetailStatusTag.textContent = ticket.status;
        ticketDetailStatusTag.className = `ticket-status-tag status-${ticket.status.toLowerCase().replace(/ /g, '-')}`;
    
        // Data formatada
        let formattedDate;
        if (ticket.created_at) {
            formattedDate = new Date(ticket.created_at).toLocaleString('pt-BR');
        } else {
            formattedDate = 'Data Desconhecida';
        }
        ticketDetailCreatedAt.textContent = formattedDate;
    
        // Email do usuário
        ticketDetailUserEmail.textContent = ticket.user_email;
    
        // Mensagens
        ticketMessagesContainer.innerHTML = '';
ticket.messages.forEach(message => {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper');

  const messageClass = message.sender === 'admin' ? 'admin-message' : 'user-message';
  messageWrapper.classList.add(messageClass);

  // Formata apenas hora e minuto
  let formattedMsgDate = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '00:00';

  const senderName = message.sender === 'admin' ? 'Admin' : 'Utilizador';

  messageWrapper.innerHTML = `
      <span class="message-sender-outside">${senderName}</span>
      <div class="message-bubble">
          <p class="message-text">${message.text}</p>
          <span class="message-timestamp">${formattedMsgDate}</span>
      </div>
  `;

  ticketMessagesContainer.appendChild(messageWrapper);
});


                
    
            
    
        ticketMessagesContainer.scrollTop = ticketMessagesContainer.scrollHeight;
    
        // Abre o modal
        openModal(ticketDetailModal);
    }
    

    async function sendAdminReply() {
        const replyText = adminReplyMessageInput.value.trim();
        if (!replyText) {
            alert("Digite uma mensagem para enviar.");
            return;
        }
        if (!currentViewingTicket) {
            console.error("Nenhum ticket selecionado para responder.");
            return;
        }

        const originalButtonHtml = sendAdminReplyBtn.innerHTML;
        sendAdminReplyBtn.disabled = true;
        sendAdminReplyBtn.textContent = "Enviando...";

        const newMessage = {
            sender: 'admin',
            text: replyText,
            timestamp: new Date().toISOString(),
            attachments: []
        };
        currentViewingTicket.messages.push(newMessage);
        openTicketDetailAdminModal(currentViewingTicket.id);
        adminReplyMessageInput.value = '';

        try {
            const response = await fetch(`${BACKEND_URL}/admin/tickets/${currentViewingTicket.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Removido cabeçalho de autorização para esta rota
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ text: replyText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedTicketData = await response.json();
            console.log("Resposta enviada, ticket atualizado:", updatedTicketData);

            await loadAllTickets();

        
        } finally {
            sendAdminReplyBtn.disabled = false;
            sendAdminReplyBtn.innerHTML = originalButtonHtml;
        }
    }

    async function changeTicketStatus(newStatus) {
        if (!currentViewingTicket) {
            console.error("Nenhum ticket selecionado para alterar o status.");
            return;
        }
        if (newStatus === currentViewingTicket.status) {
            console.log("Status não foi alterado.");
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/admin/tickets/${currentViewingTicket.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // Removido cabeçalho de autorização para esta rota
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error(`Erro ao alterar o status do ticket: status ${response.status}`);
            }

            console.log(`Status do ticket ${currentViewingTicket.id} alterado para '${newStatus}'.`);
            
            await loadAllTickets();
            
            const updatedTicket = allTickets.find(t => t.id === currentViewingTicket.id);
            if (updatedTicket) {
                currentViewingTicket = updatedTicket;
                openTicketDetailAdminModal(updatedTicket.id);
            } else {
                console.error("Ticket atualizado não encontrado após recarregar a lista.");
            }

            ticketDetailStatusTag.textContent = newStatus;
            ticketDetailStatusTag.className = `ticket-admin-status status-${newStatus.toLowerCase().replace(/ /g, '-') || 'desconhecido'}`;
            
            alert(`Status do ticket alterado para "${newStatus}" com sucesso!"`);

        } catch (error) {
            console.error("Erro ao alterar o status do ticket:", error);
            alert(`Erro ao alterar o status: ${error.message}`);
        }
    }
    
    async function loadAllUsersForAudit() {
        usersAuditList.innerHTML = '';
        loadingAuditUsers.style.display = 'block';
        noAuditUsers.style.display = 'none';

        try {
            const response = await fetch(`${BACKEND_URL}/admin/users`, {
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = await response.json();
            allUsers = users;
            renderUserList(allUsers);
        } catch (error) {
            console.error("admin.js: Erro ao carregar usuários para auditoria:", error);
            loadingAuditUsers.style.display = 'none';
            noAuditUsers.textContent = 'Erro ao carregar dados. Tente novamente.';
            noAuditUsers.style.display = 'block';
        }
    }

    function renderUserList(usersToRender) {
        loadingAuditUsers.style.display = 'none';
        usersAuditList.innerHTML = '';
        if (usersToRender.length === 0) {
            noAuditUsers.style.display = 'block';
            noAuditUsers.textContent = 'Nenhum usuário encontrado com este e-mail.';
            return;
        }
        usersToRender.forEach(user => {
            const userCard = document.createElement('div');
            userCard.classList.add('user-audit-card');
            
            let planText = user.plan_type === 'gratuito' ? 'Sem plano' : user.plan_type;
            let planTagClass = user.plan_type === 'gratuito' ? 'no-plan' : user.plan_type;

            userCard.innerHTML = `
                <div class="user-audit-header">
                    <h4>UID: ${user.uid}</h4>
                    <span class="user-audit-status status-${user.status.toLowerCase()}">${user.status}</span>
                </div>
                <p><strong>Nome:</strong> ${user.full_name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Plano:</strong> <span class="plan-tag tag-${planTagClass}">${planText}</span></p>
                <button class="btn-edit-user" data-uid="${user.uid}">Editar</button>
            `;
            usersAuditList.appendChild(userCard);
        });

        if(usersAuditList) {
            usersAuditList.querySelectorAll('.btn-edit-user').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userUid = e.target.dataset.uid;
                    const userData = allUsers.find(u => u.uid === userUid);
                    if (userData) {
                      openEditUserModal(userData);
                    } else {
                      console.error("Usuário não encontrado:", userUid);
                    }
                  });
                  
            });
        }
    }


   // === FUNÇÃO PARA ABRIR O MODAL DE EDIÇÃO DE USUÁRIO ===
   function openEditUserModal(userData) {
    console.log("Abrindo modal para UID:", userData.uid);

    const modal = document.getElementById("user-edit-modal");
    if (!modal) {
        console.error("Modal de edição de usuário não encontrado!");
        return;
    }

    // Preenche campos
    document.getElementById("edit-user-uid").value = userData.uid;
    document.getElementById("edit-user-fullname").value = userData.full_name || "";
    document.getElementById("edit-user-email").value = userData.email || "";
    document.getElementById("edit-user-plan").value = userData.plan_type || "gratuito";

    const slotWrapper = document.getElementById("slot-wrapper");
    const slotInput = document.getElementById("edit-user-slots");
    const decreaseBtn = document.getElementById("decrease-slots");
    const increaseBtn = document.getElementById("increase-slots");

    // 🔹 Usa o valor salvo no Firestore, senão usa 0
    slotInput.value = userData.slots_disponiveis ?? 0;

    // Remove eventos antigos
    decreaseBtn.replaceWith(decreaseBtn.cloneNode(true));
    increaseBtn.replaceWith(increaseBtn.cloneNode(true));

    const newDecreaseBtn = document.getElementById("decrease-slots");
    const newIncreaseBtn = document.getElementById("increase-slots");

    newDecreaseBtn.addEventListener("click", () => {
        let value = parseInt(slotInput.value, 10);
        if (value > 0) slotInput.value = value - 1;
    });

    newIncreaseBtn.addEventListener("click", () => {
        let value = parseInt(slotInput.value, 10);
        slotInput.value = value + 1;
    });

    const planSelect = document.getElementById("edit-user-plan");

    // 💡 Atualiza visibilidade e valor de slots conforme o plano
    const updateSlotVisibility = () => {
        const plan = planSelect.value;

        if (plan === "premium") {
            // 🔥 Esconde campo de slots no Premium
            slotWrapper.style.display = "none";
            slotInput.value = 0; // apenas pra não enviar lixo ao backend
        } else {
            // ✅ Exibe o campo em todos os outros planos
            slotWrapper.style.display = "flex";

            // Mantém o valor salvo, mas se não tiver, aplica padrão do plano
            if (!userData.slots_disponiveis) {
                if (plan === "essencial") slotInput.value = 3;
                else if (plan === "basico") slotInput.value = 5;
                else slotInput.value = 0; // sem plano
            }
        }
    };

    // Executa ao abrir o modal
    updateSlotVisibility();

    // Atualiza ao mudar o plano
    planSelect.addEventListener("change", updateSlotVisibility);

    // Exibe modal
    modal.classList.add("show-modal");
    document.body.style.overflow = "hidden";
}

// === FECHAR MODAL (voltar sempre pra tela inicial) ===
document.querySelectorAll(".modal-close-btn, .btn-cancelar").forEach(btn => {
    btn.addEventListener("click", () => {
      // Fecha todos os modais abertos
      document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.classList.remove("show-modal");
        modal.style.display = ""; // limpa qualquer 'display:none' que possa travar
      });
  
      // Libera o scroll da página
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "auto";
  
      // Reseta estado da tela inicial (sem recarregar)
      console.log("✅ Todos os modais foram fechados. Voltando à tela inicial.");
    });
  });
  



// === SALVAR ALTERAÇÕES DE USUÁRIO (ADMIN) ===
document.getElementById("user-edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const uid = document.getElementById("edit-user-uid").value;
    const token = localStorage.getItem("token");

    const slotsValue = Math.max(0, parseInt(document.getElementById("edit-user-slots").value, 10) || 0);

    const updatePayload = {
        fullName: document.getElementById("edit-user-fullname").value,
        email: document.getElementById("edit-user-email").value,
        plan_type: document.getElementById("edit-user-plan").value,
        custom_slots: slotsValue
    };

    try {
        const response = await fetch(`${BACKEND_URL}/admin/users/${uid}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
            alert("✅ Usuário atualizado com sucesso!");
            location.reload();
        } else {
            const err = await response.json();
            alert(`⚠️ Erro: ${err.detail || "Falha ao atualizar usuário"}`);
        }
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        alert("❌ Erro de conexão com o servidor.");
    }
});


    
    // Funções para gerenciamento de dicas
    async function loadDicas() {
        if (!dicasListContainer) return;
        dicasListContainer.innerHTML = '<p class="loading-message">Carregando dicas...</p>';

        try {
            const response = await fetch(`${BACKEND_URL}/dicas`, {
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allDicas = await response.json();
            renderDicas(allDicas);
        } catch (error) {
            console.error("Erro ao carregar dicas:", error);
            dicasListContainer.innerHTML = '<p class="error-message">Erro ao carregar dicas.</p>';
        }
    }

    function renderDicas(dicasToRender) {
        dicasListContainer.innerHTML = '';
        if (dicasToRender.length === 0) {
            dicasListContainer.innerHTML = '<p class="no-dicas-message">Nenhuma dica encontrada.</p>';
            return;
        }

        dicasToRender.forEach(dica => {
            const dicaCard = document.createElement('div');
            dicaCard.classList.add('dica-card');
            const popularTag = dica.popular ? `<span class="popular-tag">Pergunta Popular</span>` : '';
            dicaCard.innerHTML = `
                <div class="dica-card-header">
                    <h4>${dica.titulo}</h4>
                    <span class="tags">${dica.topico}</span>
                </div>
                <p>Por: ${dica.autor}</p>
                <div class="dica-actions">
                    <button class="btn-edit" data-id="${dica.id}">Editar</button>
                    <button class="btn-delete" data-id="${dica.id}">Excluir</button>
                </div>
            `;
            dicasListContainer.appendChild(dicaCard);
        });

        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                openEditDicaModal(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteDica(id);
            });
        });
    }

    function openNewDicaModal() {
        dicaModalTitle.textContent = "Criar Nova Dica";
        dicaForm.reset();
        dicaIdInput.value = '';
        openModal(dicaFormModal);
    }

    function openEditDicaModal(id) {
        const dica = allDicas.find(d => d.id === id);
        if (dica) {
            dicaModalTitle.textContent = "Editar Dica";
            dicaIdInput.value = dica.id;
            dicaTituloInput.value = dica.titulo;
            dicaAutorInput.value = dica.autor;
            dicaTopicoSelect.value = dica.topico;
            dicaConteudoTextarea.value = dica.conteudo;
            openModal(dicaFormModal);
        }
    }

    async function deleteDica(id) {
        if (!confirm("Tem certeza que deseja excluir esta dica?")) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/dicas/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            loadDicas();
            alert("Dica excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir dica:", error);
            alert("Erro ao excluir dica. Tente novamente.");
        }
    }
    
    // Funções para gerenciamento de FAQ
    async function loadFaqs() {
        const currentFaqListContainer = document.getElementById('faq-list-container');
        if (!currentFaqListContainer) return;

        currentFaqListContainer.innerHTML = '<p class="loading-message">Carregando FAQs...</p>';

        try {
            const response = await fetch(`${BACKEND_URL}/faq`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allFaqs = await response.json();
            renderFaqs(allFaqs);
        } catch (error) {
            console.error("Erro ao carregar FAQs:", error);
            currentFaqListContainer.innerHTML = '<p class="error-message">Erro ao carregar FAQs. Por favor, tente novamente.</p>';
        }
    }
    
    function renderFaqs(faqsToRender) {
        const currentFaqListContainer = document.getElementById('faq-list-container');
        if (!currentFaqListContainer) return;

        currentFaqListContainer.innerHTML = '';
        if (faqsToRender.length === 0) {
            currentFaqListContainer.innerHTML = '<p class="no-dicas-message">Nenhum FAQ encontrado.</p>';
            return;
        }
    
        faqsToRender.forEach(faq => {
            const faqCard = document.createElement('div');
            faqCard.classList.add('faq-card');
            const popularTag = faq.popular ? `<span class="popular-tag">Pergunta Popular</span>` : '';
            faqCard.innerHTML = `
                <h4>${faq.pergunta}</h4>
                <div class="faq-actions">
                    ${popularTag}
                    <button class="btn-edit" data-id="${faq.id}">Editar</button>
                    <button class="btn-delete" data-id="${faq.id}">Excluir</button>
                </div>
            `;
            currentFaqListContainer.appendChild(faqCard);
        });
    
        document.querySelectorAll('.faq-card .btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                openEditFaqModal(id);
            });
        });
    
        document.querySelectorAll('.faq-card .btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteFaq(id);
            });
        });
    }

    function openNewFaqModal() {
        faqModalTitle.textContent = "Criar Nova Pergunta";
        faqForm.reset();
        faqIdInput.value = '';
        openModal(faqFormModal);
    }
    
    function openEditFaqModal(id) {
        const faq = allFaqs.find(f => f.id === id);
        if (faq) {
            faqModalTitle.textContent = "Editar Pergunta";
            faqIdInput.value = faq.id;
            faqPerguntaInput.value = faq.pergunta;
            faqRespostaTextarea.value = faq.resposta;
            faqCategoriaSelect.value = faq.categoria;
            faqPopularCheckbox.checked = faq.popular;
            openModal(faqFormModal);
        }
    }
    
    async function deleteFaq(id) {
        if (!confirm("Tem certeza que deseja excluir esta pergunta?")) {
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/faq/${id}`, {
                method: 'DELETE',
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            allFaqs = allFaqs.filter(faq => faq.id !== id);
            renderFaqs(allFaqs);
    
            alert("FAQ excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir FAQ:", error);
            alert("Erro ao excluir FAQ. Tente novamente.");
        }
    }

    // Função para buscar dados do dashboard de feedback
   async function fetchFeedbackDataAndRenderCharts() {
  openModal(feedbackModal);
  try {
    const response = await fetch(`${BACKEND_URL}/admin/feedback_stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();

    // ✅ Preencher os cards de estatísticas (verifica se existe antes)
    totalTicketsSpan.textContent = data.total_tickets ?? 0;
    responseRateSpan.textContent = `${(data.response_rate ?? 0).toFixed(1)}%`;
    avgResolutionTimeSpan.textContent = `${(data.avg_resolution_time_hours ?? 0).toFixed(1)}h`;
    satisfactionRateSpan.textContent = `${(data.satisfaction_rate ?? 0).toFixed(1)}%`; // opcional, caso adicione depois
    pendingTicketsSpan.textContent = data.ticket_status_distribution?.Pendente?.count ?? 0;
    activeUsersFeedbackSpan.textContent = data.active_users ?? 0;
    totalUsersFeedbackSpan.textContent = data.total_users ?? 0;

    // ✅ Renderizar gráficos (ajustando nomes conforme backend)
    renderTicketsByCategoryChart(data.tickets_by_category ?? []);
    renderTicketStatusChart(data.ticket_status_distribution ?? {});
    renderMonthlyTrendChart(data.monthly_trend ?? []);
    renderActiveUsersList(data.most_active_users ?? []);

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard de feedback:", error);
    alert("Erro ao carregar o dashboard de feedback. Verifique o console para mais detalhes.");
  }
}

    function renderTicketsByCategoryChart(data) {
        if (ticketsByCategoryChart) ticketsByCategoryChart.destroy();
        
        const categoryColors = {
            'Dúvidas Gerais': '#16c98d', 
            'Suporte Técnico': '#1f63e2', 
            'Feedback/Sugestões': '#b810ce',
            'Relatório de Bugs': '#e4203a',
            'Outros': '#bab0ac',
            'Solicitações': '#e2871f',
            'Reclamações': '#e21f91'
        };

        const filteredData = data.filter(item => item.category !== 'Outros');
        
        const labels = filteredData.map(item => item.category);
        const values = filteredData.map(item => item.count);
        
        const colors = labels.map(label => categoryColors[label] || '#cccccc');
        
        ticketsByCategoryChart = new Chart(ticketsByCategoryChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tickets por Categoria',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderRadius: 7,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    function renderTicketStatusChart(data) {
        if (ticketStatusChart) ticketStatusChart.destroy();
        const labels = Object.keys(data);
        const values = Object.values(data).map(item => item.percentage);
        const backgroundColors = {
            'Finalizado': '#e2871f', 'Pendente': '#1f63e2', 'Respondido': '#16c98d', 'Em andamento': '#e4203a', 'Concluído': '#e2871f'
        };
        ticketStatusChart = new Chart(ticketStatusChartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(label => backgroundColors[label] || '#999')
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderMonthlyTrendChart(data) {
        if (monthlyTrendChart) monthlyTrendChart.destroy();
        const labels = data.map(item => item.month);
        const values = data.map(item => item.count);
        monthlyTrendChart = new Chart(monthlyTrendChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tickets por Mês',
                    data: values,
                    fill: true,
                    borderColor: '#1f63e2',
                    tension: 0.4,
                    backgroundColor: '#cedefa'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    function renderActiveUsersList(users) {
        const listContainer = document.getElementById('active-users-list');
        listContainer.innerHTML = ''; // Limpa a lista
        if (users.length === 0) {
            listContainer.innerHTML = '<p class="no-tickets-message">Nenhum usuário ativo.</p>';
            return;
        }
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.classList.add('active-user-item');
            userItem.innerHTML = `
                <span class="user-avatar">${user.name ? user.name[0].toUpperCase() : 'N/A'}</span>
                <div class="user-info">
                    <p class="user-name">${user.name || 'N/A'}</p>
                    <p class="user-email">${user.email}</p>
                </div>
                <span class="ticket-count">${user.ticket_count} tickets</span>
            `;
            listContainer.appendChild(userItem);
        });
    }

    // Inicialização da página
    fetchAdminStats();

    // Event listeners
    if (viewTicketsBtn) {
        viewTicketsBtn.addEventListener('click', () => {
            openModal(allTicketsModal);
            loadAllTickets();
        });
    }

    if (ticketSearchAdminInput) {
        ticketSearchAdminInput.addEventListener('input', (e) => {
            // NOVO: Chama a função unificada de filtros
            applyFilters();
        });
    }

    // NOVO: Lógica do seletor customizado
    if (customSelectWrapper) {
        selectSelected.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague para o document
            selectItemsContainer.classList.toggle('select-hide');
            selectSelected.classList.toggle('select-arrow-active');
        });

        // Adiciona um listener para cada item da lista
        selectItemsContainer.querySelectorAll('.select-item').forEach(item => {
            item.addEventListener('click', function() {
                const newValue = this.dataset.value;
                const newText = this.textContent.trim().replace('✔', ''); // Remove o check para exibir
                
                // Remove a classe 'selected' e o ícone de check do item anterior
                selectItemsContainer.querySelectorAll('.select-item').forEach(li => {
                    li.classList.remove('selected');
                    const checkIcon = li.querySelector('.fas.fa-check');
                    if (checkIcon) checkIcon.remove();
                });

                // Adiciona a classe 'selected' e o ícone de check ao item clicado
                this.classList.add('selected');
                const checkIcon = document.createElement('i');
                checkIcon.classList.add('fas', 'fa-check');
                this.appendChild(checkIcon);

                // Atualiza o texto e o valor do cabeçalho do seletor
                selectSelected.textContent = newText + ' '; // Adiciona espaço antes do ícone
                selectSelected.appendChild(document.createElement('i')).classList.add('fas', 'fa-chevron-down', 'dropdown-icon');
                selectSelected.dataset.value = newValue;
                ticketStatusFilterValue = newValue; // Atualiza a variável global

                selectItemsContainer.classList.add('select-hide'); // Esconde a lista
                selectSelected.classList.remove('select-arrow-active'); // Remove a classe de ativo do cabeçalho
                
                applyFilters(); // Aplica o filtro após a seleção
            });
        });

        // Fecha o seletor se clicar em qualquer lugar fora dele
        document.addEventListener('click', (e) => {
            if (!customSelectWrapper.contains(e.target)) {
                selectItemsContainer.classList.add('select-hide');
                selectSelected.classList.remove('select-arrow-active');
            }
        });
    }

    if (auditUsersBtn) {
        auditUsersBtn.addEventListener('click', () => {
            openModal(auditUsersModal);
            loadAllUsersForAudit();
        });
    }
    
    if (manageDicasBtn) {
        manageDicasBtn.addEventListener('click', () => {
            openModal(dicaModal);
            loadDicas();
        });
    }

    if (openNewDicaBtn) {
        openNewDicaBtn.addEventListener('click', openNewDicaModal);
    }
    
    if (dicaForm) {
        dicaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = dicaIdInput.value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${BACKEND_URL}/dicas/${id}` : `${BACKEND_URL}/dicas`;
    
            const dicaData = {
                titulo: dicaTituloInput.value,
                autor: dicaAutorInput.value,
                topico: dicaTopicoSelect.value,
                conteudo: dicaConteudoTextarea.value,
            };
    
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        // Removido cabeçalho de autorização para esta rota
                    },
                    body: JSON.stringify(dicaData),
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    
                closeModal(dicaFormModal);
                loadDicas();
                alert(`Dica ${id ? 'editada' : 'criada'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao salvar dica:", error);
                alert("Erro ao salvar dica. Tente novamente.");
            }
        });
    }

    // Listeners do FAQ
    if(manageFaqBtn) {
        manageFaqBtn.addEventListener('click', () => {
            openModal(faqModal);
            loadFaqs();
        });
    }
    
    if (openNewFaqBtn) {
        openNewFaqBtn.addEventListener('click', () => {
            console.log("admin.js: Botão 'Nova Pergunta' clicado.");
            openNewFaqModal();
        });
    }

    if (faqForm) {
        faqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = faqIdInput.value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${BACKEND_URL}/faq/${id}` : `${BACKEND_URL}/faq`;
            
            const faqData = {
                pergunta: faqPerguntaInput.value,
                resposta: faqRespostaTextarea.value,
                categoria: faqCategoriaSelect.value,
                popular: faqPopularCheckbox.checked,
            };

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        // Removido cabeçalho de autorização para esta rota
                    },
                    body: JSON.stringify(faqData),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const newFaq = await response.json();
                
                closeModal(faqFormModal);
                
                if (id) {
                    const index = allFaqs.findIndex(f => f.id === id);
                    if (index !== -1) allFaqs[index] = newFaq;
                } else {
                    allFaqs.push(newFaq);
                }
                renderFaqs(allFaqs);
                
                alert(`FAQ ${id ? 'editado' : 'criado'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao salvar FAQ:", error);
                alert("Erro ao salvar FAQ. Tente novamente.");
            }
        });
    }

    if (viewFeedbackBtn) {
        viewFeedbackBtn.addEventListener('click', fetchFeedbackDataAndRenderCharts);
    }
    
    // NOVO: Adicionando o event listener para o botão Blog
    if (manageBlogBtn) {
        manageBlogBtn.addEventListener('click', () => {
            openModal(blogModal);
            // Chama a função para carregar os artigos do blog
            loadArticles();
        });
    }

    // Funções para gerenciamento de artigos do blog
    async function loadArticles() {
        if (!articlesListContainer) return;
        articlesListContainer.innerHTML = '<p class="loading-message">Carregando artigos...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/articles`, { 
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allArticles = await response.json();
            renderArticles(allArticles);
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            articlesListContainer.innerHTML = '<p class="error-message">Erro ao carregar artigos.</p>';
        }
    }

    function renderArticles(articlesToRender) {
        if (!articlesListContainer) return;
        articlesListContainer.innerHTML = '';
        if (articlesToRender.length === 0) {
            articlesListContainer.innerHTML = '<p class="no-articles-message">Nenhum artigo encontrado.</p>';
            return;
        }
        articlesToRender.forEach(article => {
            const articleCard = document.createElement('div');
            articleCard.classList.add('article-admin-card');

            const tempoLeitura = article.tempo_leitura || calcularTempoDeLeitura(article.conteudo);
            const tagClass = `tag-${article.topico.toLowerCase().replace(/ /g, '-')}`;

            articleCard.innerHTML = `
                <div class="article-card-header">
                    <h4>${article.titulo}</h4>
                    <span class="tags ${tagClass}">${article.topico}</span>
                </div>
                <div class="article-card-body">
                    <div class="article-footer">
                        <span class="author">Por: ${article.autor}</span>
                        <span class="read-time">${tempoLeitura} min. de leitura</span>
                    </div>
                </div>
                <div class="article-actions">
                    <button class="btn-edit" data-id="${article.id}">Editar</button>
                    <button class="btn-delete" data-id="${article.id}">Excluir</button>
                </div>
            `;
            articlesListContainer.appendChild(articleCard);
        });

        document.querySelectorAll('.article-admin-card .btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                openEditArticleModal(id);
            });
        });

        document.querySelectorAll('.article-admin-card .btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteArticle(id);
            });
        });
    }

    function openNewArticleModal() {
        const blogTopicGroup = document.querySelector('#blog-topic');
        if (blogTopicGroup) {
            blogTopicGroup.parentNode.remove();
        }

        blogModalTitle.textContent = "Criar Novo Artigo";
        blogForm.reset();
        blogIdInput.value = '';
        openModal(blogFormModal);
    }

    function openEditArticleModal(id) {
        const blogTopicGroup = document.querySelector('#blog-topic');
        if (blogTopicGroup) {
            blogTopicGroup.parentNode.remove();
        }

        const article = allArticles.find(d => d.id === id);
        if (article) {
            blogModalTitle.textContent = "Editar Artigo";
            blogIdInput.value = article.id;
            blogTitleInput.value = article.titulo;
            blogAuthorInput.value = article.autor;
            blogContentTextarea.value = article.conteudo;
            openModal(blogFormModal);
        }
    }

    async function deleteArticle(id) {
        if (!confirm("Tem certeza que deseja excluir este artigo?")) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/articles/${id}`, {
                method: 'DELETE',
                headers: {
                    // Removido cabeçalho de autorização para esta rota
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            loadArticles();
            alert("Artigo excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir artigo:", error);
            alert("Erro ao excluir artigo. Tente novamente.");
        }
    }

    if (openNewArticleBtn) {
        openNewArticleBtn.addEventListener('click', openNewArticleModal);
    }
    
    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = blogIdInput.value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${BACKEND_URL}/articles/${id}` : `${BACKEND_URL}/articles`;
            
            const conteudo = blogContentTextarea.value;
            const tempoLeitura = calcularTempoDeLeitura(conteudo);

            const articleData = {
                titulo: blogTitleInput.value,
                autor: blogAuthorInput.value,
                topico: "Notícias", // Valor fixo
                conteudo: conteudo,
                tempo_leitura: tempoLeitura, // Adiciona o tempo de leitura
            };

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        // Removido cabeçalho de autorização para esta rota
                    },
                    body: JSON.stringify(articleData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                closeModal(blogFormModal);
                loadArticles();
                alert(`Artigo ${id ? 'editado' : 'criado'} com sucesso!`);
            } catch (error) {
                console.error("Erro ao salvar artigo:", error);
                alert("Erro ao salvar artigo. Tente novamente.");
            }
        });
    }


    // Iniciar carregamento de estatísticas e tickets ao carregar a página
    fetchAdminStats();
    loadAllTickets();
    
    // CORREÇÃO: Adicionando event listeners para os botões do modal de tickets
    if (sendAdminReplyBtn) {
        sendAdminReplyBtn.addEventListener('click', sendAdminReply);
    }

    if (changeStatusSelect) {
        changeStatusSelect.addEventListener('change', (e) => {
            changeTicketStatus(e.target.value);
        });
    }

    // Lógica de Polling
    let pollingInterval;
    async function checkAdminTicketsForUpdates() {
        if (!allTicketsModal || !allTicketsModal.classList.contains('show-modal')) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/admin/tickets`, {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                    // Removido cabeçalho de autorização para esta rota
                }
            });
            if (!response.ok) {
                console.error("Erro na verificação periódica de tickets do admin.");
                return;
            }
            
            const newTickets = await response.json();
            
            if (JSON.stringify(allTickets) !== JSON.stringify(newTickets)) {
                console.log("Detectadas atualizações nos tickets do admin. Recarregando...");
                allTickets = newTickets; 
                
                // NOVO: Chama a função unificada de filtros
                applyFilters();

                if (ticketDetailModal.classList.contains('show-modal') && currentViewingTicket) {
                    const updatedTicket = allTickets.find(t => t.id === currentViewingTicket.id);
                    if (updatedTicket) {
                        openTicketDetailAdminModal(updatedTicket.id);
                    }
                }
            }
        } catch (error) {
            console.error("Erro durante a verificação de atualizações:", error);
        }
    }

    setInterval(checkAdminTicketsForUpdates, 5000);
});