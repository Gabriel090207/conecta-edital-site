document.addEventListener('DOMContentLoaded', async () => {
    console.log("admin.js: Script carregado e DOM content loaded.");

    const BACKEND_URL = "https://conecta-edital-site.onrender.com";
    const token = localStorage.getItem("adminToken");

    let allUsers = [];
    let allTickets = [];
    let currentViewingTicket = null;
    let allDicas = [];
    let allFaqs = [];

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
    const ticketDetailModal = document.getElementById('ticket-detail-modal');
    const ticketDetailTitle = document.getElementById('ticket-detail-title');
    const ticketDetailCreatedAt = document.getElementById('ticket-detail-created-at');
    const ticketDetailStatusTag = document.getElementById('ticket-detail-status-tag');
    const ticketDetailUserEmail = document.getElementById('ticket-detail-user-email');
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
                    'Authorization': `Bearer ${token}`,
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
                    'Authorization': `Bearer ${token}`, // Adicionando token aqui
                    "ngrok-skip-browser-warning": "true"
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allTickets = await response.json();
            
            // Renderiza a lista inicial completa
            renderTicketsList(allTickets);

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

    // NOVA FUNÇÃO DE FILTRAGEM
    function applySearchFilter(searchTerm) {
        let filteredTickets = [...allTickets];
        
        if (searchTerm) {
            const normalizedSearchTerm = normalizeString(searchTerm);
            filteredTickets = filteredTickets.filter(ticket =>
                normalizeString(ticket.subject).includes(normalizedSearchTerm) ||
                normalizeString(ticket.id).includes(normalizedSearchTerm) ||
                (ticket.messages && ticket.messages.some(msg => normalizeString(msg.text).includes(normalizedSearchTerm)))
            );
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
                
                let formattedDate;
                if (ticket.created_at) {
                    formattedDate = new Date(ticket.created_at).toLocaleString('pt-BR');
                } else {
                    formattedDate = 'Data Desconhecida';
                }

                ticketCard.innerHTML = `
                    <div class="ticket-admin-header">
                        <h4>Ticket #${ticket.id.substring(0, 8)} - ${ticket.subject}</h4>
                        <span class="ticket-admin-status status-${ticket.status.toLowerCase().replace(/ /g, '-') || 'desconhecido'}">${ticket.status}</span>
                    </div>
                    <p class="ticket-admin-info">Criado em: ${formattedDate}</p>
                    <p class="ticket-admin-info">Por: ${ticket.user_email}</p>
                    <button class="btn-view-ticket-admin" data-ticket-id="${ticket.id}">Ver Detalhes</button>
                `;
                ticketsListAdmin.appendChild(ticketCard);
            });

            ticketsListAdmin.querySelectorAll('.btn-view-ticket-admin').forEach(button => {
                button.addEventListener('click', (e) => {
                    const ticketId = e.currentTarget.dataset.ticketId;
                    openTicketDetailAdminModal(ticketId);
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
        ticketDetailTitle.textContent = `Ticket #${ticket.id.substring(0, 8)} - ${ticket.subject}`;
        
        let formattedDate;
        if (ticket.created_at) {
            formattedDate = new Date(ticket.created_at).toLocaleString('pt-BR');
        } else {
            formattedDate = 'Data Desconhecida';
        }
        
        ticketDetailCreatedAt.textContent = `Criado em: ${formattedDate}`;
        ticketDetailStatusTag.textContent = ticket.status;
        ticketDetailStatusTag.className = `ticket-admin-status status-${ticket.status.toLowerCase().replace(/ /g, '-') || 'desconhecido'}`;
        ticketDetailUserEmail.textContent = ticket.user_email;
        changeStatusSelect.value = ticket.status;

        ticketMessagesContainer.innerHTML = '';
        ticket.messages.forEach(message => {
            const messageBubble = document.createElement('div');
            const messageClass = message.sender === 'admin' ? 'admin-message' : 'user-message';
            messageBubble.classList.add('message-bubble', messageClass);
            
            let formattedMsgDate;
            if (message.timestamp) {
                formattedMsgDate = new Date(message.timestamp).toLocaleString('pt-BR');
            } else {
                formattedMsgDate = 'Data Desconhecida';
            }

            const senderName = message.sender === 'admin' ? 'Admin' : 'Utilizador';
            
            messageBubble.innerHTML = `
                <span class="message-sender">${senderName}</span>
                <p class="message-text">${message.text}</p>
                <span class="message-timestamp">${formattedMsgDate}</span>
            `;
            ticketMessagesContainer.appendChild(messageBubble);
        });
        ticketMessagesContainer.scrollTop = ticketMessagesContainer.scrollHeight;

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
                    'Authorization': `Bearer ${token}`, // Adicionando token aqui
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

        } catch (error) {
            console.error("Erro ao enviar resposta do admin:", error);
            alert(`Erro ao enviar resposta: ${error.message}`);
            currentViewingTicket.messages.pop();
            openTicketDetailAdminModal(currentViewingTicket.id);
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
                    'Authorization': `Bearer ${token}`, // Adicionando token aqui
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
                    'Authorization': `Bearer ${token}`, // Adicionando token aqui
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
            `;
            usersAuditList.appendChild(userCard);
        });
    }

    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user =>
                user.email.toLowerCase().includes(searchTerm)
            );
            renderUserList(filteredUsers);
        });
    }
    
    // Funções para gerenciamento de dicas
    async function loadDicas() {
        if (!dicasListContainer) return;
        dicasListContainer.innerHTML = '<p class="loading-message">Carregando dicas...</p>';

        try {
            const response = await fetch(`${BACKEND_URL}/dicas`);
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
            
            // Preencher os cards de estatísticas
            totalTicketsSpan.textContent = data.total_tickets;
            responseRateSpan.textContent = `${data.response_rate.toFixed(1)}%`;
            avgResolutionTimeSpan.textContent = `${data.avg_resolution_time_hours}h`;
            satisfactionRateSpan.textContent = `${data.satisfaction_rate.toFixed(1)}%`;
            pendingTicketsSpan.textContent = data.pending_tickets;
            activeUsersFeedbackSpan.textContent = data.active_users_count;
            totalUsersFeedbackSpan.textContent = data.total_users;

            // Renderizar gráficos
            renderTicketsByCategoryChart(data.tickets_by_category);
            renderTicketStatusChart(data.ticket_status_distribution);
            renderMonthlyTrendChart(data.monthly_ticket_trend);
            renderActiveUsersList(data.most_active_users);

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
            'Feedback/Sugestões': '#f28e2b',
            'Relatório de Bugs': '#b415d4',
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
            'Resolvido': '#59a14f', 'Aguardando': '#8cd140', 'Em Atendimento': '#e15759', 'Concluído': '#4e79a7'
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
                    borderColor: '#4e79a7',
                    tension: 0.1
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
            const searchTerm = e.target.value.trim();
            applySearchFilter(searchTerm);
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
                        'Authorization': `Bearer ${token}` // Proteção de rota
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
                        'Authorization': `Bearer ${token}` // Proteção de rota
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

    // Novos Event Listeners para o modal de ticket
    if (sendAdminReplyBtn) {
        sendAdminReplyBtn.addEventListener('click', sendAdminReply);
    }
    
    if (changeStatusSelect) {
        changeStatusSelect.addEventListener('change', (e) => {
            changeTicketStatus(e.target.value);
        });
    }
    
    // Novo Event Listener para o botão de Feedback
    if (viewFeedbackBtn) {
        viewFeedbackBtn.addEventListener('click', fetchFeedbackDataAndRenderCharts);
    }
    
    // --- Lógica de Polling para Atualização em Tempo Real ---

    async function checkAdminTicketsForUpdates() {
        if (!allTicketsModal || !allTicketsModal.classList.contains('show-modal')) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/admin/tickets`, {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                    'Authorization': `Bearer ${token}`
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
                
                const searchTerm = ticketSearchAdminInput ? ticketSearchAdminInput.value.trim() : '';
                applySearchFilter(searchTerm);

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