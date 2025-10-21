document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";

    const createTicketModal = document.getElementById('create-ticket-modal');
    const openNewChamadoBtn = document.querySelector('#open-new-chamado-btn');
    const createTicketForm = document.getElementById('create-ticket-form');
    const createTicketSubmitBtn = document.getElementById('create-ticket-submit-btn');
    const newTicketCategorySelect = document.getElementById('ticket-category');

    const ticketSubject = document.getElementById('ticket-subject');
    const ticketDescription = document.getElementById('ticket-description');
    const ticketsListContainer = document.getElementById('tickets-list-container');
    const noTicketsMessage = document.getElementById('no-tickets-message');

    const ticketDetailModal = document.getElementById('ticket-detail-modal');
    const ticketDetailId = document.getElementById('ticket-detail-id');
    const ticketDetailTitle = document.getElementById('ticket-detail-title');
    const ticketDetailCreatedAt = document.getElementById('ticket-detail-created-at');
    const ticketDetailAssignee = document.getElementById('ticket-detail-assignee');
    const ticketStatusDisplay = document.getElementById('ticket-status-display');
    const ticketStatusBanner = document.getElementById('ticket-status-banner');
    const ticketMessagesContainer = document.getElementById('ticket-messages-container');
    const replyMessageInput = document.getElementById('reply-message-input');
    const sendReplyBtn = document.getElementById('send-reply-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('ticket-attachments');
    const fileUploadArea = document.getElementById('file-upload-area');
    const selectedFilesPreview = document.getElementById('selected-files-preview');
    let uploadedFiles = [];
    
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

    const profileModal = document.getElementById('profile-modal');
    const openProfileModalBtn = document.getElementById('open-profile-modal-btn');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const profileInfoForm = document.getElementById('profile-info-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const createPasswordContainer = document.getElementById('create-password-container');
    const createPasswordForm = document.getElementById('create-password-form');
    const profileFullNameInput = document.getElementById('profile-full-name');
    const profileUsernameDisplay = document.getElementById('profile-username-display');
    const profileContactInput = document.getElementById('profile-contact');
    const profileEmailInput = document.getElementById('profile-email');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const profileDefaultAvatar = document.getElementById('profileDefaultAvatar');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const createNewPasswordInput = document.getElementById('create-new-password');
    const createConfirmPasswordInput = document.getElementById('create-confirm-password');
    const profileImageUploadInput = document.getElementById('profileImageUpload');
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    const passwordToggleButtons = document.querySelectorAll('.toggle-password');
    const editUsernameBtn = document.getElementById('editUsernameBtn');
    
    let currentUserName = 'Vinicius'; 
    let currentUsername = 'usuario';

    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden';
            if (modalElement === createTicketModal) {
                createTicketForm.reset();
                selectedFilesPreview.innerHTML = '';
                uploadedFiles = [];
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
    
    function closeAllModals() {
        document.querySelectorAll('.modal-overlay.show-modal').forEach(modal => {
            modal.classList.remove('show-modal');
        });
        document.body.style.overflow = '';
    }

    async function getAuthToken() {
        const user = window.firebase.auth().currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    async function handleApiAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            console.error("Token de autenticação inválido ou expirado. Redirecionando para login.");
            await window.firebase.auth().signOut();
            window.location.href = 'login-cadastro.html';
            return true;
        }
        return false;
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

    function applyFiltersAndSort() {
        let filteredTickets = [...currentUserTickets];
        
        if (ticketSearchInput) {
            const searchTerm = normalizeString(ticketSearchInput.value);
            if (searchTerm) {
                filteredTickets = filteredTickets.filter(ticket =>
                    normalizeString(ticket.subject).includes(searchTerm) ||
                    normalizeString(ticket.id).includes(searchTerm) ||
                    (ticket.messages && ticket.messages.some(msg => normalizeString(msg.text).includes(searchTerm)))
                );
            }
        }

        const selectedStatusOption = statusMenu.querySelector('.dropdown-option.active');
        const selectedStatus = selectedStatusOption ? selectedStatusOption.dataset.value : 'all';
        if (selectedStatus !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => normalizeString(ticket.status) === normalizeString(selectedStatus));
        }

        const selectedCategoryOption = categoryMenu.querySelector('.dropdown-option.active');
        const selectedCategory = selectedCategoryOption ? selectedCategoryOption.dataset.value : 'all';
        if (selectedCategory !== 'all') {
            const normalizedCategory = normalizeString(selectedCategory);
            filteredTickets = filteredTickets.filter(ticket => {
                const ticketCategory = normalizeString(ticket.category || 'Outros');
                return ticketCategory === normalizedCategory;
            });
        }

        const sortOrderOption = sortMenu.querySelector('.dropdown-option.active');
        const sortOrder = sortOrderOption ? sortOrderOption.dataset.value : 'recent';
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
        ticketDetailId.textContent = `#${ticket.id.substring(0, 8)}`;
        ticketDetailTitle.textContent = ticket.subject;
        ticketDetailCreatedAt.textContent = new Date(ticket.created_at).toLocaleString('pt-BR');
        ticketDetailAssignee.textContent = ticket.assignee || 'Não Atribuído';
        ticketStatusDisplay.textContent = ticket.status;
        ticketStatusBanner.className = `ticket-status-banner status-${normalizeString(ticket.status)}`;

        ticketMessagesContainer.innerHTML = '';

        ticket.messages.forEach(message => {
            const messageWrapper = document.createElement('div');
            messageWrapper.classList.add('message-wrapper', message.sender === 'user' ? 'sent' : 'received');

            let senderName = '';
            let senderRole = '';
            let avatarContent = '';
            let isUserMessage = message.sender === 'user';

            if (isUserMessage) {
                senderName = currentUsername || 'Você';
                const avatarText = currentUserName ? currentUserName.charAt(0) : 'U';

                if (window.firebase.auth().currentUser && window.firebase.auth().currentUser.photoURL) {
                    avatarContent = `<img src="${window.firebase.auth().currentUser.photoURL}" alt="${avatarText}">`;
                } else {
                    avatarContent = `<span>${avatarText}</span>`;
                }
            } else {
                senderName = ticket.assignee || 'Maria Silva';
                senderRole = 'SUPORTE';
                avatarContent = `<i class="fas fa-headset"></i>`;
            }
            
            // Adiciona o cabeçalho para as mensagens do suporte
            const messageHeader = document.createElement('div');
            messageHeader.classList.add('message-header');
            
            if (isUserMessage) {
                messageHeader.innerHTML = `<span class="message-sender">${senderName}</span>`;
            } else {
                messageHeader.innerHTML = `
                    <span class="message-sender">${senderName}</span>
                    ${senderRole ? `<span class="message-sender-role">${senderRole}</span>` : ''}
                `;
            }

            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble', isUserMessage ? 'sent' : 'received');
            messageBubble.innerHTML = `
                <span class="message-text">${message.text}</span>
                <span class="message-timestamp">${new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            `;

            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            messageContent.appendChild(messageHeader);
            messageContent.appendChild(messageBubble);

            const avatar = document.createElement('div');
            avatar.classList.add('message-sender-avatar', isUserMessage ? 'sent' : 'received');
            avatar.innerHTML = avatarContent;

            if (isUserMessage) {
                messageWrapper.appendChild(messageContent);
                messageWrapper.appendChild(avatar);
            } else {
                messageWrapper.appendChild(avatar);
                messageWrapper.appendChild(messageContent);
            }

            ticketMessagesContainer.appendChild(messageWrapper);
        });

        ticketMessagesContainer.scrollTop = ticketMessagesContainer.scrollHeight;
        openModal(ticketDetailModal);
    }

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
        sendReplyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

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
            
            const createdTicket = await response.json();
            console.log('Resposta enviada com sucesso para o backend.');

            await loadTicketsForCurrentUser();

        
        } finally {
            sendReplyBtn.disabled = false;
            sendReplyBtn.innerHTML = originalButtonHtml;
        }
    }

    async function createNewTicket() {
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

        const newTicketCategory = newTicketCategorySelect ? newTicketCategorySelect.value : "Outros";
        if (!newTicketCategory || newTicketCategory === "") {
            alert('Por favor, selecione uma categoria.');
            return;
        }

        createTicketSubmitBtn.disabled = true;
        createTicketSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const token = await getAuthToken();
        if (!token) {
            alert('Você precisa estar logado para criar um ticket.');
            createTicketSubmitBtn.disabled = false;
            createTicketSubmitBtn.textContent = 'Criar Ticket';
            return;
        }

        const newTicketData = {
            subject: ticketSubject.value.trim(),
            category: newTicketCategory,
            initial_message: ticketDescription.value.trim(),
            attachments: uploadedFiles.map(file => ({
                fileName: file.name,
                fileType: file.type
            }))
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
            
            if (uploadedFiles.length > 0) {
                const firebaseStorageRef = window.firebase.storage().ref();
                for (const file of uploadedFiles) {
                    const filePath = `tickets/${createdTicket.id}/${file.name}`;
                    const fileRef = firebaseStorageRef.child(filePath);
                    await fileRef.put(file);
                }
            }

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
    }


    function getPlanDescription(planType) {
        switch(planType) {
            case 'premium':
                return 'Plano premium com todos os recursos.';
            case 'essencial':
                return 'Plano essencial com 3 monitoramentos inclusos.';
            case 'basico':
                return 'Plano básico com 5 monitoramentos inclusos.';
            default:
                return 'Você não possui um plano ativo. Faça upgrade para mais recursos.';
        }
    }

    function updateProfilePictureUI(photoURL) {
        const profileImagePreview = document.getElementById('profileImagePreview');
        const profileDefaultAvatar = document.getElementById('profileDefaultAvatar');

        if (!profileImagePreview || !profileDefaultAvatar) {
            console.error("Erro: Elementos de foto de perfil não encontrados.");
            return;
        }
        if (photoURL) {
            profileImagePreview.src = photoURL;
            profileImagePreview.style.display = 'block';
            profileDefaultAvatar.style.display = 'none';
        } else {
            profileImagePreview.style.display = 'none';
            profileDefaultAvatar.style.display = 'flex';
        }
    }

    async function fetchUserProfile() {
        const user = window.firebase.auth().currentUser;
        if (!user) { return; }
        const idToken = await user.getIdToken();
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (await handleApiAuthError(response)) return;
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do perfil.');
            }
            const userData = await response.json();
            
            profileFullNameInput.value = userData.fullName || '';
            profileContactInput.value = userData.contact || '';
            profileEmailInput.value = userData.email || '';
            
            currentUserName = userData.fullName || '';
            currentUsername = userData.username || 'Usuário';

            const profileUsernameDisplay = document.getElementById('profile-username-display');
            if (profileUsernameDisplay) {
                profileUsernameDisplay.textContent = userData.username ? `@${userData.username}` : '@usuário não informado';
            }
            
            // Lógica unificada para atualizar a foto de perfil em todos os lugares
            const userProfilePicture = document.getElementById('userProfilePicture');
            const userDefaultAvatar = document.getElementById('userDefaultAvatar');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const dropdownUserName = document.getElementById('dropdownUserName');

            const photoURL = user.photoURL || userData.photoURL;

            if (photoURL) {
                if (userProfilePicture) {
                    userProfilePicture.src = photoURL;
                    userProfilePicture.style.display = 'block';
                }
                if (userDefaultAvatar) userDefaultAvatar.style.display = 'none';

                // Atualiza a foto no modal de perfil
                const modalProfilePicture = document.getElementById('profileImagePreview');
                const modalProfileDefaultAvatar = document.getElementById('profileDefaultAvatar');
                if (modalProfilePicture) {
                    modalProfilePicture.src = photoURL;
                    modalProfilePicture.style.display = 'block';
                }
                if (modalProfileDefaultAvatar) modalProfileDefaultAvatar.style.display = 'none';

            } else {
                if (userProfilePicture) userProfilePicture.style.display = 'none';
                if (userDefaultAvatar) {
                    userDefaultAvatar.style.display = 'block';
                    userDefaultAvatar.textContent = userData.fullName ? userData.fullName.charAt(0) : 'U';
                }
            
                // Atualiza o avatar padrão no modal de perfil
                const modalProfilePicture = document.getElementById('profileImagePreview');
                const modalProfileDefaultAvatar = document.getElementById('profileDefaultAvatar');
                if (modalProfilePicture) modalProfilePicture.style.display = 'none';
                if (modalProfileDefaultAvatar) {
                    modalProfileDefaultAvatar.style.display = 'flex';
                    modalProfileDefaultAvatar.textContent = userData.fullName ? userData.fullName.charAt(0) : 'U';
                }
            }
            
            // PRIORIZA O NOME DE USUÁRIO NO MENU DA BARRA DE NAVEGAÇÃO
            userNameDisplay.textContent = userData.username || userData.fullName || 'Usuário';
            
            // CORRIGE A SAUDAÇÃO NO DROPDOWN
            const firstName = userData.fullName ? userData.fullName.split(' ')[0] : 'Usuário';
            dropdownUserName.textContent = `Olá, ${firstName}!`;

            const planTitleModal = document.querySelector('#subscription-tab .plan-title');
            const planDescriptionModal = document.querySelector('#subscription-tab .plan-description');
            const planIconWrapperModal = document.querySelector('#subscription-tab .plan-icon-wrapper');
            const planIconModal = planIconWrapperModal ? planIconWrapperModal.querySelector('i') : null;

            const planType = (userData.plan_type || 'gratuito').toLowerCase();

            if (planTitleModal) {
                planTitleModal.textContent = planType === 'gratuito' ? 'Sem Plano' : planType.charAt(0).toUpperCase() + planType.slice(1);
            }
            if (planDescriptionModal) {
                planDescriptionModal.textContent = getPlanDescription(planType);
            }

            if (planIconWrapperModal) {
                planIconWrapperModal.className = 'plan-icon-wrapper';
                if (planType === 'premium') {
                    planIconWrapperModal.classList.add('gold-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-crown';
                } else if (planType === 'essencial' || planType === 'basico') {
                    planIconWrapperModal.classList.add('orange-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-shield-alt';
                } else {
                    planIconWrapperModal.classList.add('grey-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-shield-alt';
                }
            }
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            alert('Erro ao carregar os dados do seu perfil.');
        }
    }

    async function updateUsername(newUsername) {
        const user = window.firebase.auth().currentUser;
        if (!user) { alert("Você não está logado."); return; }
        const idToken = await user.getIdToken();
    
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ username: newUsername })
            });
            if (await handleApiAuthError(response)) return;
            if (response.ok) {
                alert('Nome de usuário atualizado com sucesso!');
                fetchUserProfile(); 
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar o nome de usuário: ${errorData.detail || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição para atualizar o nome de usuário:', error);
            alert('Ocorreu um erro ao se conectar com o servidor.');
        }
    }

    async function updateProfileInfo() {
        const user = window.firebase.auth().currentUser;
        if (!user) { alert("Você não está logado."); return; }
        const idToken = await user.getIdToken();
        const contact = profileContactInput.value.trim();
        const updateData = {};
        if (contact) {
            updateData.contact = contact;
        } else {
            alert('Por favor, preencha o campo de Telefone para atualizar.');
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(updateData)
            });
            if (await handleApiAuthError(response)) return;
            if (response.ok) {
                alert('Perfil atualizado com sucesso!');
                fetchUserProfile();
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar o perfil: ${errorData.detail || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição para atualizar o perfil:', error);
            alert('Ocorreu um erro ao se conectar com o servidor.');
        }
    }

    async function changePassword() {
        const user = window.firebase.auth().currentUser;
        if (!user) { alert("Você não está logado."); return; }
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (!currentPassword) {
            alert('Por favor, digite a sua senha atual para confirmar.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('A nova senha e a confirmação não correspondem.');
            return;
        }
        if (newPassword.length < 6) {
            alert('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }
        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            alert('Senha alterada com sucesso!');
            if (changePasswordForm) {
                changePasswordForm.reset();
            }
        } catch (error) {
            console.error('Erro ao alterar senha:', error.code, error.message);
            let errorMessage = 'Erro desconhecido ao alterar a senha.';
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'A senha atual está incorreta. Tente novamente.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Esta é uma operação sensível. Por favor, saia e entre novamente para confirmar sua identidade antes de alterar a senha.';
            } else {
                errorMessage = `Erro: ${error.message}`;
            }
            alert(errorMessage);
        }
    }

    async function createPassword() {
        const user = window.firebase.auth().currentUser;
        if (!user) { alert("Você não está logado."); return; }
        const newPassword = createNewPasswordInput.value;
        const confirmPassword = createConfirmPasswordInput.value;
        if (newPassword !== confirmPassword) {
            alert('A nova senha e a confirmação não correspondem.');
            return;
        }
        if (newPassword.length < 6) {
            alert('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }
        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, newPassword);
            await user.linkWithCredential(credential);
            alert('Senha criada com sucesso! Agora você pode fazer login com e-mail e senha.');
            createPasswordForm.reset();
            checkAuthProviderAndRenderSecurityTab();
        } catch (error) {
            console.error('Erro ao criar senha:', error.code, error.message);
            alert(`Erro ao criar a senha: ${error.message}`);
        }
    }
    
    function checkAuthProviderAndRenderSecurityTab() {
        const user = window.firebase.auth().currentUser;
        if (!user) return;
        const hasPasswordProvider = user.providerData.some(provider => provider.providerId === 'password');
        if (hasPasswordProvider) {
            if (changePasswordForm) changePasswordForm.style.display = 'block';
            if (createPasswordContainer) createPasswordContainer.style.display = 'none';
        } else {
            if (changePasswordForm) changePasswordForm.style.display = 'none';
            if (createPasswordContainer) createPasswordContainer.style.display = 'block';
        }
    }
    
    function handleEditUsername() {
        const usernameDisplay = document.getElementById('profile-username-display');
        const usernameWrapper = document.querySelector('.profile-username-wrapper');
        const currentUsernameText = usernameDisplay.textContent.replace('@', '').trim();
    
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentUsernameText;
        input.className = 'edit-username-input';
    
        usernameWrapper.replaceChild(input, usernameDisplay);
        input.focus();
    
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        saveBtn.className = 'save-username-btn';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.className = 'cancel-username-btn';
        
        const editBtn = document.getElementById('editUsernameBtn');
        editBtn.style.display = 'none';
        usernameWrapper.appendChild(saveBtn);
        usernameWrapper.appendChild(cancelBtn);
    
        saveBtn.addEventListener('click', async () => {
            const newUsername = input.value.trim();
            if (newUsername && newUsername !== currentUsernameText) {
                await updateUsername(newUsername);
            }
            restoreUsernameView(newUsername || currentUsernameText);
        });
    
        cancelBtn.addEventListener('click', () => {
            restoreUsernameView(currentUsernameText);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
        
        function restoreUsernameView(username) {
            usernameDisplay.textContent = `@${username}`;
            usernameWrapper.replaceChild(usernameDisplay, input);
            usernameWrapper.removeChild(saveBtn);
            usernameWrapper.removeChild(cancelBtn);
            editBtn.style.display = 'block';
        }
    }

    function handleFileSelection(files) {
        selectedFilesPreview.innerHTML = '';
        uploadedFiles = Array.from(files);
        uploadedFiles.forEach(file => {
            const fileTag = document.createElement('span');
            fileTag.classList.add('file-tag');
            fileTag.innerHTML = `
                ${file.name}
                <i class="fas fa-times remove-file" data-filename="${file.name}"></i>
            `;
            selectedFilesPreview.appendChild(fileTag);
        });
    }

    if (openProfileModalBtn) {
        openProfileModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(profileModal);
            fetchUserProfile(); 
        });
    }

    document.querySelectorAll('.modal-close-btn, .btn-cancel-form').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = e.currentTarget.dataset.modalId;
            const modalToClose = document.getElementById(modalId);
            closeModal(modalToClose);
        });
    });

    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                if (targetTab === 'security-tab') {
                    checkAuthProviderAndRenderSecurityTab();
                }
            });
        });
    }

    if (profileInfoForm) {
        profileInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfileInfo();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }

    if (createPasswordForm) {
        createPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createPassword();
        });
    }

    if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', handleEditUsername);
    }
    
    if (ticketSearchInput) ticketSearchInput.addEventListener('input', applyFiltersAndSort);
    if (sendReplyBtn) { sendReplyBtn.addEventListener('click', addReplyToTicket); }
    if (replyMessageInput) {
        replyMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addReplyToTicket();
            }
        });
    }
    if (createTicketForm) { createTicketForm.addEventListener('submit', async (event) => { event.preventDefault(); await createNewTicket(); }); }
    if (openNewChamadoBtn) { openNewChamadoBtn.addEventListener('click', () => { openModal(createTicketModal); }); }
    
    function setupFilterListeners() {
        const toggleDropdown = (button, menu) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
                document.querySelectorAll('.dropdown-toggle').forEach(b => { if (b !== button) b.classList.remove('active'); });
                const isShowing = menu.classList.toggle('show');
                button.classList.toggle('active', isShowing);
            });
        };
        
        if (statusToggle && statusMenu) toggleDropdown(statusToggle, statusMenu);
        if (categoryToggle && categoryMenu) toggleDropdown(categoryToggle, categoryMenu);
        if (sortToggle && sortMenu) toggleDropdown(sortToggle, sortMenu);

        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const menu = e.target.closest('.dropdown-menu');
                if (!menu) return;
                const filterType = menu.dataset.filter;
                menu.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                const displaySpan = document.getElementById(`${filterType}-display`);
                if (displaySpan) { displaySpan.textContent = e.target.textContent; }
                menu.classList.remove('show');
                const toggleButton = document.getElementById(`${filterType}-toggle`);
                if (toggleButton) toggleButton.classList.remove('active');
                applyFiltersAndSort();
            });
        });
        
        window.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
            document.querySelectorAll('.dropdown-toggle').forEach(button => button.classList.remove('active'));
        });
    }
    
    setupFilterListeners();

    if (attachFileBtn) {
        attachFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelection(e.target.files);
        });
    }

    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('drag-over');
        });
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('drag-over');
        });
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('drag-over');
            handleFileSelection(e.dataTransfer.files);
        });
    }

    if (selectedFilesPreview) {
        selectedFilesPreview.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file')) {
                const fileName = e.target.dataset.filename;
                uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
                e.target.closest('.file-tag').remove();
            }
        });
    }

    
    let pollingInterval;
    async function checkTicketsForUpdates() {
        if (!window.firebase.auth().currentUser) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            return;
        }

        const token = await getAuthToken();
        if (!token) { return; }

        try {
            const response = await fetch(`${BACKEND_URL}/api/tickets`, { headers: { 'Authorization': `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } });
            if (!response.ok) { console.error(`Erro na verificação periódica de tickets: ${response.status}`); return; }
            const newTickets = await response.json();
            
            if (JSON.stringify(currentUserTickets) !== JSON.stringify(newTickets)) {
                console.log("Detectadas atualizações nos tickets. A lista foi recarregada.");
                currentUserTickets = newTickets;
                applyFiltersAndSort();
                
                if (ticketDetailModal && ticketDetailModal.classList.contains('show-modal') && currentOpenTicketId) {
                    const updatedTicket = currentUserTickets.find(t => t.id === currentOpenTicketId);
                    if (updatedTicket) { openTicketDetailModal(updatedTicket.id); }
                }
            }
        } catch (error) { console.error("Erro durante a verificação de atualizações:", error); }
    }

    if (!pollingInterval) { pollingInterval = setInterval(checkTicketsForUpdates, 5000); }

    window.firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadTicketsForCurrentUser();
            fetchUserProfile(); 
        } else {
            ticketsListContainer.innerHTML = '';
            noTicketsMessage.style.display = 'flex';
            currentUserTickets = [];
            
            const userProfilePicture = document.getElementById('userProfilePicture');
            const userDefaultAvatar = document.getElementById('userDefaultAvatar');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const dropdownUserName = document.getElementById('dropdownUserName');
            const profileImagePreview = document.getElementById('profileImagePreview');
            const profileDefaultAvatar = document.getElementById('profileDefaultAvatar');

            if (userProfilePicture) userProfilePicture.style.display = 'none';
            if (userDefaultAvatar) userDefaultAvatar.style.display = 'block';
            if (userDefaultAvatar) userDefaultAvatar.textContent = 'U';
            if (userNameDisplay) userNameDisplay.textContent = 'Usuário';
            if (dropdownUserName) dropdownUserName.textContent = 'Olá, Usuário!';

            if (profileImagePreview) profileImagePreview.style.display = 'none';
            if (profileDefaultAvatar) {
                profileDefaultAvatar.style.display = 'flex';
                profileDefaultAvatar.textContent = 'U';
            }
        }
    });

});