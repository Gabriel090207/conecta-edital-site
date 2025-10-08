document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos elementos HTML dos Cards de Resumo e Modais ---
    const slotsAvailableValue = document.getElementById('slots-available-value');
    const slotsFreeStatus = document.getElementById('slots-free-status');
    const monitorsCountValue = document.getElementById('monitors-count-value');
    const monitorsActiveStatus = document.getElementById('monitors-active-status');
    const monitoringListSection = document.getElementById('monitoring-list');
    const initialNoMonitoramentoMessage = document.getElementById('initial-no-monitoramento-message');
    const planValue = document.getElementById('plan-value');
    const planStatus = document.getElementById('plan-status');
    const planIconWrapper = document.querySelector('.summary-card.current-plan .summary-icon-wrapper');
    const planIcon = planIconWrapper ? planIconWrapper.querySelector('i') : null;
    const currentPlanCard = document.querySelector('.summary-card.current-plan');
    const slotsIconWrapper = document.querySelector('.summary-card.available-slots .summary-icon-wrapper');
    const slotsIcon = slotsIconWrapper ? slotsIconWrapper.querySelector('i') : null;

    // Modais e Botões
    const openNewMonitoramentoModalBtn = document.getElementById('open-new-monitoramento-modal');
    const createFirstMonitoramentoBtn = document.getElementById('create-first-monitoramento-btn');
    const chooseTypeModal = document.getElementById('choose-type-modal');
    const personalMonitoramentoModal = document.getElementById('personal-monitoramento-modal');
    const radarMonitoramentoModal = document.getElementById('radar-monitoramento-modal');
    const monitoramentoAtivadoModal = document.getElementById('monitoramento-ativado-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
    const btnCancelModal = document.querySelector('#choose-type-modal .btn-cancel-modal');
    const btnCancelForms = document.querySelectorAll('.modal-form .btn-cancel-form');
    const typeOptionCards = document.querySelectorAll('.type-option-card');
    
    // NOVO: Modal de Perfil e seus elementos
    const profileModal = document.getElementById('profile-modal');
    const openProfileModalBtn = document.getElementById('open-profile-modal-btn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const profileInfoForm = document.getElementById('profile-info-form');
    const profileSecurityForm = document.getElementById('profile-security-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const createPasswordContainer = document.getElementById('create-password-container');
    const createPasswordForm = document.getElementById('create-password-form');
    const profileFullNameInput = document.getElementById('profile-full-name');
    const profileUsernameInput = document.getElementById('profile-username');
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
    // CORREÇÃO: Adicionando referência ao campo de nome completo do formulário de monitoramento pessoal
    const personalNameInput = document.getElementById('personal-name');

    // NOVO: Referências para o upload da foto de perfil
    const profileImageUploadInput = document.getElementById('profileImageUpload');
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    const passwordToggleButtons = document.querySelectorAll('.toggle-password');

    // NOVO: Referência ao botão de edição do nome de usuário
    const editUsernameBtn = document.getElementById('editUsernameBtn');


    // Formulários
    const personalMonitoringForm = document.getElementById('personal-monitoring-form');
    const radarMonitoringForm = document.getElementById('radar-monitoring-form');

    // Modal de Ativação (Progresso)
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const activationSteps = document.querySelectorAll('.activation-step');
    const activationCompletedMessage = document.querySelector('.activation-completed-message');
    
    // --- URL base do seu backend FastAPI ---
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";

    // --- VARIÁVEL GLOBAL PARA ARMAZENAR OS DADOS DO DASHBOARD ---
    let currentMonitorings = [];
    let currentStatusData = {};

    // --- Funções Auxiliares de UI ---
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden'; 
        } else {
            console.error("Erro: Tentativa de abrir um modal nulo.");
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            if (modalElement === personalMonitoramentoModal && personalMonitoringForm) personalMonitoringForm.reset();
            if (modalElement === radarMonitoramentoModal && radarMonitoringForm) radarMonitoringForm.reset();

            const anyModalOpen = document.querySelector('.modal-overlay.show-modal');
            if (!anyModalOpen) {
                document.body.style.overflow = ''; 
            }
        } else {
            console.error("Erro: Tentativa de fechar um modal nulo.");
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay.show-modal').forEach(modal => {
            modal.classList.remove('show-modal');
            if (modal === personalMonitoramentoModal && personalMonitoringForm) personalMonitoringForm.reset();
            if (modal === radarMonitoramentoModal && radarMonitoringForm) radarMonitoringForm.reset();
        });
        document.body.style.overflow = '';
    }

    async function handleApiAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            console.error("Token de autenticação inválido ou expirado. Redirecionando para login.");
            if (typeof window.auth !== 'undefined') {
                await window.auth.signOut();
            }
            window.location.href = 'login-cadastro.html';
            return true;
        }
        return false;
    }

    function showUpgradeAlert() {
        window.location.href = 'planos.html';
    }

    function createMonitoringItemHTML(mon) {
        const itemCard = document.createElement('div');
        itemCard.classList.add('monitoramento-item-card');
        itemCard.dataset.id = mon.id;
        itemCard.dataset.type = mon.monitoring_type;

    
        const titleIconClass = 'fas fa-bell';
        const typeBadgeText = mon.monitoring_type === 'personal' ? 'Pessoal' : 'Radar';
    
        const toggleLabelText = mon.status === 'active' ? 'Ativo' : 'Inativo';
        const statusTagClass = mon.status === 'active' ? 'status-monitoring' : 'status-inativo';
    
        const detailsHtml = `
            <!-- ID -->
            <div class="detail-item detail-id">
                <i class="fas fa-id-card"></i>
                <span>ID do Edital / Concurso</span>
                <p><strong>${mon.edital_identifier || 'N/A'}</strong></p>
            </div>
    
            <!-- Nome do candidato (só no Pessoal) -->
            ${mon.monitoring_type === 'personal' ? `
            <div class="detail-item detail-candidato">
                <i class="fas fa-user" style="text-shadow:
                    -1px -1px 0 #a600e8ff,
                     1px -1px 0 #a600e8ff,
                    -1px  1px 0 #a600e8ff,
                     1px  1px 0 #a600e8ff;">
                </i>
                <span>Nome do Candidato(a)</span>
                <p><strong>${mon.candidate_name || 'N/A'}</strong></p>
            </div>` : ''}
    
            <!-- Diário -->
            <div class="detail-item detail-diario">
                <i class="fas fa-book-open" style="text-shadow:
                    -1px -1px 0 #07a8ff,
                     1px -1px 0 #07a8ff,
                    -1px  1px 0 #07a8ff,
                     1px  1px 0 #07a8ff;">
                </i>
                <span>Diário Oficial</span>
                <p><a href="${mon.official_gazette_link || '#'}" target="_blank" class="link-diario">Acessar Diário Oficial</a></p>
            </div>
    
            <!-- Última verificação -->
            <div class="detail-item detail-verificacao">
                <i class="fas fa-clock" style="text-shadow:
                    -1px -1px 0 #230094ff,
                     1px -1px 0 #230094ff,
                    -1px  1px 0 #230094ff,
                     1px  1px 0 #230094ff;">
                </i>
                <span>Última Verificação</span>
                <p><strong>${mon.last_checked_at ? new Date(mon.last_checked_at).toLocaleString('pt-BR') : 'Nunca verificado'}</strong></p>
            </div>
    
            <!-- Palavras-chave -->
            <div class="detail-item detail-palavras">
                <i class="fas fa-key" style="text-shadow:
                    -1px -1px 0 #656766ff,
                     1px -1px 0 #656766ff,
                    -1px  1px 0 #656766ff,
                     1px  1px 0 #656766ff;">
                </i>
                <span>Palavras-chave Monitoradas</span>
                <div class="keyword-tags">
                    ${(mon.keywords || mon.candidate_name || '')
                        .split(',')
                        .map(k => `<span class="keyword-tag">${k.trim()}</span>`)
                        .join('')}
                </div>
            </div>
    
            <!-- Ocorrências -->
            <div class="detail-item detail-ocorrencias">
                <i class="fas fa-history" style="text-shadow:
                    -1px -1px 0 #009479ff,
                     1px -1px 0 #009479ff,
                    -1px  1px 0 #009479ff,
                     1px  1px 0 #009479ff;">
                </i>
                <span>Ocorrências</span>
                <p class="occurrences-count">
                    <strong>${mon.occurrences || 0} ocorrência(s)</strong>
                    <a href="#" class="view-history-link">Ver Histórico</a>
                </p>
            </div>
    
           <!-- Notificações -->
<div class="detail-item detail-notificacao">
    <i class="fas fa-bell" style="text-shadow:
        -1px -1px 0 #a600e8ff,
         1px -1px 0 #a600e8ff,
        -1px  1px 0 #a600e8ff,
         1px  1px 0 #a600e8ff;">
    </i>
    <span>Status das Notificações</span>
    <div class="notification-status">
        ${
            currentStatusData.user_plan === 'Plano Essencial'
                ? `<span class="notification-tag email-enabled">Email</span>`
                : `
                    <span class="notification-tag email-enabled">Email</span>
                    <span class="notification-tag whatsapp-enabled">WhatsApp</span>
                  `
        }
    </div>
</div>



        `;
    
        itemCard.innerHTML = `
            <div class="item-header">
                <div class="item-header-title">
                    <i class="${titleIconClass}"></i>
                    <h3>Monitoramento ${typeBadgeText} - ${mon.edital_identifier || mon.id}</h3>
                    <button class="edit-btn" data-id="${mon.id}" title="Editar monitoramento"><i class="fas fa-pencil-alt"></i></button>
                    <button class="favorite-btn" data-id="${mon.id}" title="Marcar como favorito"><i class="far fa-star"></i></button>
                </div>
                <span class="status-tag ${statusTagClass}">
                    ${mon.status === 'active' ? 'Monitorando' : 'Inativo'}
                </span>
            </div>
    
            <!-- aplica grid diferente para Pessoal vs Radar -->
            <div class="item-details-grid ${mon.monitoring_type === 'personal' ? 'grid-personal' : 'grid-radar'}">
                ${detailsHtml}
            </div>
    
            <div class="item-actions">
                <div class="toggle-switch">
                    <input type="checkbox" id="toggle-monitoramento-${mon.id}" ${mon.status === 'active' ? 'checked' : ''} data-id="${mon.id}">
                    <label for="toggle-monitoramento-${mon.id}">${toggleLabelText}</label>
                </div>
                <div class="action-buttons">
                    <button class="btn-action btn-configure" data-id="${mon.id}"><i class="fas fa-cog"></i> Configurar</button>
                    <button class="btn-action btn-test" data-id="${mon.id}"><i class="fas fa-play"></i> Testar</button>
                    <button class="btn-action btn-delete" data-id="${mon.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            </div>
        `;
    
        return itemCard;
    }
    

    // NOVA FUNÇÃO: Gerencia a exibição da foto ou do placeholder
    function updateProfilePictureUI(photoURL) {
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
            // As iniciais são definidas em common-auth-ui.js
        }
    }

    // NOVO: Função para obter e preencher os dados do perfil
    async function fetchUserProfile() {
        const user = window.auth.currentUser;
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
            
            // Preenche os campos do formulário de informações
            profileFullNameInput.value = userData.fullName || '';
            profileContactInput.value = userData.contact || '';
            profileEmailInput.value = userData.email || '';
            
            // CORREÇÃO: Fixa o nome completo no campo do modal de monitoramento pessoal
            if (personalNameInput && userData.fullName) {
                personalNameInput.value = userData.fullName;
                personalNameInput.disabled = true; 
            } else if (personalNameInput) {
                personalNameInput.disabled = false;
            }

            // Atualiza o display do nome de usuário com @
            const profileUsernameDisplay = document.getElementById('profile-username-display');
            if (profileUsernameDisplay) {
                profileUsernameDisplay.textContent = userData.username ? `@${userData.username}` : '@Usuário não informado';
            }
            
            // Corrige a exibição da foto de perfil
            updateProfilePictureUI(userData.photoURL);

            // Preenche a aba de Assinatura dinamicamente
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
                planIconWrapperModal.className = 'plan-icon-wrapper'; // Reseta a classe
                if (planType === 'premium') {
                    planIconWrapperModal.classList.add('gold-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-crown';
                } else if (planType === 'essencial' || planType === 'basico') {
                    planIconWrapperModal.classList.add('orange-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-shield-alt';
                } else { // Plano Gratuito / Sem Plano
                    planIconWrapperModal.classList.add('grey-summary-bg');
                    if (planIconModal) planIconModal.className = 'fas fa-shield-alt';
                }
            }


            // Atualiza a foto e o nome no dropdown
            const userProfilePicture = document.getElementById('userProfilePicture');
            const userDefaultAvatar = document.getElementById('userDefaultAvatar');
            const userNameDisplay = document.getElementById('userNameDisplay');

            if (userData.photoURL) {
                userProfilePicture.src = userData.photoURL;
                userProfilePicture.style.display = 'block';
                userDefaultAvatar.style.display = 'none';
            } else {
                userProfilePicture.style.display = 'none';
                userDefaultAvatar.style.display = 'flex';
                // Define a primeira letra do nome completo para o placeholder
                userDefaultAvatar.textContent = userData.fullName ? userData.fullName.charAt(0) : 'U';
            }

            // CORREÇÃO: Altera a prioridade de exibição do nome para usar o username ou o primeiro nome do fullName
            const nomeParaExibir = userData.username 
                ? userData.username.split(' ')[0] 
                : (userData.fullName ? userData.fullName.split(' ')[0] : 'Usuário');

            userNameDisplay.textContent = nomeParaExibir;
            dropdownUserName.textContent = `Olá, ${nomeParaExibir}!`;

        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            alert('Erro ao carregar os dados do seu perfil.');
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

    // NOVO: Função para atualizar as informações do perfil
    async function updateProfileInfo() {
        const user = window.auth.currentUser;
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

    // NOVO: Função para alterar a senha (CORRIGIDA)
    async function changePassword() {
        const user = window.auth.currentUser;
        if (!user) {
            alert("Você não está logado.");
            return;
        }

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
            // Limpa os campos do formulário após o sucesso
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
    
    // NOVA FUNÇÃO: Função para criar uma senha para usuários com login social
    async function createPassword() {
        const user = window.auth.currentUser;
        if (!user) {
            alert("Você não está logado.");
            return;
        }

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
            checkAuthProviderAndRenderSecurityTab(); // Re-renderiza a aba de segurança
        } catch (error) {
            console.error('Erro ao criar senha:', error.code, error.message);
            alert(`Erro ao criar a senha: ${error.message}`);
        }
    }

    // NOVO: Função para fazer o upload da foto de perfil para o Firebase Storage
    async function uploadProfilePicture(file) {
        const user = window.auth.currentUser;
        if (!user) return;

        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`profile-pictures/${user.uid}/${file.name}`);

        try {
            await fileRef.put(file);
            const photoURL = await fileRef.getDownloadURL();
            await user.updateProfile({ photoURL });
            
            // Envia a URL da foto para o backend para sincronização
            const idToken = await user.getIdToken();
            await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ photo_url: photoURL })
            });
            alert('Foto de perfil atualizada com sucesso!');
            fetchUserProfile(); 
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
            alert('Erro ao atualizar a foto de perfil. Tente novamente.');
        }
    }

    window.loadDashboardDataAndRender = async function() {
        const user = window.auth.currentUser;
        if (!user) { return; }
    
        try {
            const idToken = await user.getIdToken();
            const responseStatus = await fetch(`${BACKEND_URL}/api/status`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            const responseMonitorings = await fetch(`${BACKEND_URL}/api/monitoramentos`, { 
                headers: { 'Authorization': `Bearer ${idToken}` } 
            });
    
            if (await handleApiAuthError(responseStatus) || await handleApiAuthError(responseMonitorings)) return;
            if (!responseStatus.ok || !responseMonitorings.ok) {
                throw new Error("Erro ao buscar dados do dashboard.");
            }
    
            const statusData = await responseStatus.json();
            const monitoramentosList = await responseMonitorings.json();
    
            currentStatusData = statusData;
            currentMonitorings = monitoramentosList;
    
            updateSummaryCards(statusData);
            loadMonitorings(monitoramentosList);
            fetchUserProfile();
    
            // ⚡️ Adicione esta linha:
            if (typeof syncAllFavoriteButtons === "function") syncAllFavoriteButtons();
    
        
     // Adiciona a chamada para carregar os dados do perfil
            
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            if (monitorsCountValue) monitorsCountValue.textContent = 'N/A';
            if (monitorsActiveStatus) monitorsActiveStatus.textContent = 'Erro';
            if (slotsAvailableValue) slotsAvailableValue.textContent = 'N/A';
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Erro';
            if (initialNoMonitoramentoMessage) initialNoMonitoramentoMessage.style.display = 'flex';
        }
    };


    function updateSummaryCards(data) {
        const actualUserPlan = data.user_plan; 
        let canCreateNewMonitoring = true;

        if (actualUserPlan === 'Plano Premium') {
            if (slotsAvailableValue) slotsAvailableValue.textContent = 'Ilimitado';
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Sempre disponíveis';
            if (slotsIcon) { slotsIcon.className = 'fas fa-infinity'; slotsIcon.style.color = 'white'; }
            if (slotsIconWrapper) { slotsIconWrapper.classList.remove('green-summary-bg', 'blue-summary-bg', 'orange-summary-bg', 'red-summary-bg', 'grey-summary-bg'); slotsIconWrapper.classList.add('gold-summary-bg'); }
            if (planValue) planValue.textContent = 'Premium';
            if (planStatus) planStatus.textContent = 'Todos os recursos inclusos';
            if (planIcon) { planIcon.className = 'fas fa-crown'; planIcon.style.color = 'white'; }
            if (planIconWrapper) { planIconWrapper.classList.remove('orange-summary-bg', 'blue-summary-bg', 'green-summary-bg', 'red-summary-bg', 'grey-summary-bg'); planIconWrapper.classList.add('gold-summary-bg'); }
            if (currentPlanCard) { currentPlanCard.classList.remove('basic-plan-card', 'essencial-plan-card', 'no-plan-card'); currentPlanCard.classList.add('premium-plan-card'); }
            
            if (initialNoMonitoramentoMessage && initialNoMonitoramentoMessage.querySelector('p')) {
                const pElement = initialNoMonitoramentoMessage.querySelector('p');
                pElement.textContent = 'Você ainda não possui monitoramentos. Crie seu primeiro monitoramento para começar e aproveite seus slots ilimitados!';
                if (createFirstMonitoramentoBtn) { 
                    createFirstMonitoramentoBtn.href = '#';
                    createFirstMonitoramentoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoBtn.style.opacity = '1';
                    createFirstMonitoramentoBtn.style.cursor = 'pointer';
                    createFirstMonitoramentoBtn.disabled = false;
                }
            }
            canCreateNewMonitoring = true;
        } else if (actualUserPlan === 'Plano Essencial') { 
            if (slotsAvailableValue) slotsAvailableValue.textContent = `${data.slots_livres}`;
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Slots disponíveis';
            if (slotsIcon) { slotsIcon.className = 'fas fa-check-circle'; slotsIcon.style.color = 'white'; }
            if (slotsIconWrapper) { slotsIconWrapper.classList.remove('gold-summary-bg', 'blue-summary-bg', 'orange-summary-bg', 'red-summary-bg', 'grey-summary-bg'); slotsIconWrapper.classList.add('green-summary-bg'); }
            if (planValue) planValue.textContent = 'Essencial';
            if (planStatus) planStatus.textContent = '3 monitoramentos inclusos';
            if (planIcon) { planIcon.className = 'fas fa-shield-alt'; planIcon.style.color = 'white'; }
            if (planIconWrapper) { planIconWrapper.classList.remove('gold-summary-bg', 'green-summary-bg', 'blue-summary-bg', 'red-summary-bg', 'grey-summary-bg'); planIconWrapper.classList.add('orange-summary-bg'); }
            if (currentPlanCard) { currentPlanCard.classList.remove('premium-plan-card', 'basic-plan-card', 'no-plan-card'); currentPlanCard.classList.add('essencial-plan-card'); }
            if (initialNoMonitoramentoMessage && initialNoMonitoramentoMessage.querySelector('p')) {
                const pElement = initialNoMonitoramentoMessage.querySelector('p');
                pElement.textContent = 'Você ainda não possui monitoramentos. Crie seu primeiro monitoramento e aproveite seus 3 slots!';
                if (createFirstMonitoramentoBtn) {
                    createFirstMonitoramentoBtn.href = '#';
                    createFirstMonitoramentoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoBtn.style.opacity = '1';
                    createFirstMonitoramentoBtn.style.cursor = 'pointer';
                    createFirstMonitoramentoBtn.disabled = false;
                }
            }
            canCreateNewMonitoring = data.slots_livres > 0;
        } else if (actualUserPlan === 'Plano Básico') {
            if (slotsAvailableValue) slotsAvailableValue.textContent = `${data.slots_livres}`;
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Slots disponíveis';
            if (slotsIcon) { slotsIcon.className = 'fas fa-check-circle'; slotsIcon.style.color = 'white'; }
            if (slotsIconWrapper) { slotsIconWrapper.classList.remove('gold-summary-bg', 'blue-summary-bg', 'orange-summary-bg', 'red-summary-bg', 'grey-summary-bg'); slotsIconWrapper.classList.add('green-summary-bg'); }
            if (planValue) planValue.textContent = 'Plano Básico';
            if (planStatus) planStatus.textContent = '5 monitoramentos inclusos';
            if (planIcon) { planIcon.className = 'fas fa-shield-alt'; planIcon.style.color = 'white'; }
            if (planIconWrapper) { planIconWrapper.classList.remove('gold-summary-bg', 'green-summary-bg', 'blue-summary-bg', 'red-summary-bg', 'grey-summary-bg'); planIconWrapper.classList.add('orange-summary-bg'); }
            if (currentPlanCard) { currentPlanCard.classList.remove('premium-plan-card', 'essencial-plan-card', 'no-plan-card'); currentPlanCard.classList.add('basic-plan-card'); }
            if (initialNoMonitoramentoMessage && initialNoMonitoramentoMessage.querySelector('p')) {
                const pElement = initialNoMonitoramentoMessage.querySelector('p');
                pElement.textContent = 'Você ainda não possui monitoramentos. Crie seu primeiro monitoramento e aproveite seus 5 slots!';
                if (createFirstMonitoramentoBtn) {
                    createFirstMonitoramentoBtn.href = '#';
                    createFirstMonitoramentoBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoBtn.style.opacity = '1';
                    createFirstMonitoramentoBtn.style.cursor = 'pointer';
                    createFirstMonitoramentoBtn.disabled = false;
                }
            }
            canCreateNewMonitoring = data.slots_livres > 0;
        } else {
            if (slotsAvailableValue) slotsAvailableValue.textContent = 0;
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Slots indisponíveis';
            if (slotsIcon) { slotsIcon.className = 'fas fa-times-circle'; slotsIcon.style.color = 'white'; }
            if (slotsIconWrapper) { slotsIconWrapper.classList.remove('gold-summary-bg', 'blue-summary-bg', 'green-summary-bg', 'orange-summary-bg'); slotsIconWrapper.classList.add('red-summary-bg'); }
            canCreateNewMonitoring = false;
            if (planValue) planValue.textContent = 'Sem Plano';
            if (planStatus) planStatus.textContent = 'Faça upgrade para criar monitoramentos'; 
            if (planIcon) { planIcon.className = 'fas fa-shield-alt'; planIcon.style.color = 'white'; }
            if (planIconWrapper) { planIconWrapper.classList.remove('gold-summary-bg', 'green-summary-bg', 'blue-summary-bg', 'red-summary-bg'); planIconWrapper.classList.add('grey-summary-bg'); }
            if (currentPlanCard) { currentPlanCard.classList.remove('premium-plan-card', 'essencial-plan-card', 'basic-plan-card'); currentPlanCard.classList.add('no-plan-card'); }
            if (initialNoMonitoramentoMessage && initialNoMonitoramentoMessage.querySelector('p')) {
                const pElement = initialNoMonitoramentoMessage.querySelector('p');
                pElement.textContent = 'Você ainda não possui monitoramentos. Seus slots estão indisponíveis. Visite a página de planos para mais opções.';
                if (createFirstMonitoramentoBtn) {
                    createFirstMonitoramentoBtn.href = 'planos.html';
                    createFirstMonitoramentoBtn.innerHTML = 'Ver planos';
                    createFirstMonitoramentoBtn.style.opacity = '1';
                    createFirstMonitoramentoBtn.style.cursor = 'pointer';
                    createFirstMonitoramentoBtn.disabled = false;
                }
            }
        }
        
        if (monitorsCountValue) monitorsCountValue.textContent = `${data.total_monitoramentos}`;
        if (monitorsActiveStatus) monitorsActiveStatus.textContent = `${data.monitoramentos_ativos} ativo${data.monitoramentos_ativos !== 1 ? 's' : ''}`;
        
        if (initialNoMonitoramentoMessage) {
            if (data.total_monitoramentos === 0) { initialNoMonitoramentoMessage.style.display = 'flex'; } else { initialNoMonitoramentoMessage.style.display = 'none'; }
        }

        if (openNewMonitoramentoModalBtn) {
            openNewMonitoramentoModalBtn.removeEventListener('click', showUpgradeAlert);
            openNewMonitoramentoModalBtn.removeEventListener('click', () => openModal(chooseTypeModal));
            if (canCreateNewMonitoring) { 
                openNewMonitoramentoModalBtn.disabled = false; openNewMonitoramentoModalBtn.style.opacity = '1'; openNewMonitoramentoModalBtn.style.cursor = 'pointer'; 
                openNewMonitoramentoModalBtn.addEventListener('click', () => openModal(chooseTypeModal));
            } else { 
                openNewMonitoramentoModalBtn.disabled = true; openNewMonitoramentoModalBtn.style.opacity = '0.5'; openNewMonitoramentoModalBtn.style.cursor = 'not-allowed'; 
                openNewMonitoramentoModalBtn.addEventListener('click', showUpgradeAlert);
            }
        }
        if (createFirstMonitoramentoBtn) {
            createFirstMonitoramentoBtn.removeEventListener('click', showUpgradeAlert);
            createFirstMonitoramentoBtn.removeEventListener('click', () => openModal(chooseTypeModal));
            if (canCreateNewMonitoring) { 
                createFirstMonitoramentoBtn.disabled = false; createFirstMonitoramentoBtn.style.opacity = '1'; createFirstMonitoramentoBtn.style.cursor = 'pointer'; 
                createFirstMonitoramentoBtn.addEventListener('click', () => openModal(chooseTypeModal));
            } else { 
                createFirstMonitoramentoBtn.disabled = false; createFirstMonitoramentoBtn.style.opacity = '1'; createFirstMonitoramentoBtn.style.cursor = 'pointer'; 
                createFirstMonitoramentoBtn.addEventListener('click', showUpgradeAlert);
            }
        }
    }
    
    function loadMonitorings(monitoramentos) {
        if (monitoringListSection) { 
            Array.from(monitoringListSection.children).forEach(child => {
                if (child.id !== 'initial-no-monitoramento-message') { child.remove(); }
            });
        }
        if (monitoramentos.length > 0) { 
            if(initialNoMonitoramentoMessage) initialNoMonitoramentoMessage.style.display = 'none';
            monitoramentos.forEach(mon => { 
                const newItem = createMonitoringItemHTML(mon); 
                if (monitoringListSection) { monitoringListSection.prepend(newItem); }
            }); 
        } else { 
            if(initialNoMonitoramentoMessage) initialNoMonitoramentoMessage.style.display = 'flex';
        }
    }

    function startActivationProgress() {
        const steps = document.querySelectorAll(".activation-step");
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-percentage");
        let step = 0;
        const totalSteps = steps.length;
        function nextStep() {
            if (step < totalSteps) {
                steps[step].classList.add("active");
                let progress = ((step + 1) / totalSteps) * 100;
                progressBar.style.width = progress + "%";
                progressText.textContent = Math.round(progress) + "%";
                step++;
                setTimeout(nextStep, 1500);
            } else {
                const modalAtivado = document.getElementById('monitoramento-ativado-modal');
                window.loadDashboardDataAndRender();
                const completedMessage = document.createElement('div');
                completedMessage.className = 'activation-completed-message';
                completedMessage.innerHTML = '<p>Configuração Concluída, Você receberá notificações sempre que houver atualizações relevantes.</p>';
                modalAtivado.querySelector('.modal-content').appendChild(completedMessage);
                
                setTimeout(() => {
                    modalAtivado.classList.remove('show-modal');
                    document.body.style.overflow = '';
                }, 1000);
            }
        }
        nextStep();
    }

    const deleteMonitoring = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este monitoramento?')) { return; }
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` } });
            if (await handleApiAuthError(response)) return; if (response.status === 204) { console.log(`Monitoramento ${id} excluído com sucesso!`); window.loadDashboardDataAndRender(); } else if (response.status === 404) { alert('Monitoramento não encontrado.'); console.warn(`Monitoramento ${id} não encontrado no backend.`); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao excluir.'); }
        } catch (error) { console.error("Erro ao excluir monitoramento:", error); alert(`Falha ao excluir monitoramento: ${error.message}`); }
    };

    const toggleMonitoringStatus = async (id, isActive) => {
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify({ active: isActive }) });
            if (await handleApiAuthError(response)) return; if (response.ok) { console.log(`Monitoramento ${id} status alterado para ${isActive ? 'Ativo' : 'Inativo'}.`); const statusTag = document.querySelector(`[data-id="${id}"] .status-tag`); if (statusTag) { statusTag.textContent = isActive ? 'Monitorando' : 'Inativo'; } window.loadDashboardDataAndRender(); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao alternar status.'); }
        } catch (error) { console.error("Erro ao alternar status do monitoramento:", error); alert(`Falha ao alternar status: ${error.message}`); const checkbox = document.getElementById(`toggle-monitoramento-${id}`); if (checkbox) { checkbox.checked = !isActive; } }
    };

    const testMonitoring = async (id) => {
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}/test`, { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` } });
            if (await handleApiAuthError(response)) return; if (response.ok) { const result = await response.json(); console.log(`Teste de monitoramento ${id} disparado com sucesso!`, result); alert('Teste de monitoramento iniciado! Verifique os logs do backend para o resultado e seu email se uma ocorrência for encontrada.'); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao testar.'); }
        } catch (error) { console.error("Erro ao testar monitoramento:", error); alert(`Falha ao testar monitoramento: ${error.message}`); }
    };

    // --- Listeners de Eventos Globais ---
    // Listener unificado para os botões de fechar modal (X) e botões "Cancelar" dentro dos formulários
    document.querySelectorAll('.modal-close-btn, .btn-cancel-form').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = e.currentTarget.dataset.modalId || 'profile-modal';
            const modalToClose = document.getElementById(modalId);
            closeModal(modalToClose);
    
            // Se for o botão de cancelamento dos formulários de monitoramento, reabre a modal de escolha de tipo
            if (modalToClose.id !== 'profile-modal' && modalId === 'profile-modal') {
                // Esta condição nunca será verdadeira, mas a lógica para os formulários de monitoramento está aqui
            }
        });
    });

    if (btnCancelModal) { btnCancelModal.addEventListener('click', () => { closeModal(chooseTypeModal); }); }
    btnCancelForms.forEach(btn => { btn.addEventListener('click', () => { closeModal(personalMonitoramentoModal); closeModal(radarMonitoramentoModal); openModal(chooseTypeModal); }); });
    document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', (e) => { if (e.target === overlay) { closeAllModals(); } }); });
    typeOptionCards.forEach(card => {
        const btnSelectType = card.querySelector('.btn-select-type');
        const btnSelectType1 = card.querySelector('.btn-select-type1');
        const handleTypeSelection = async (e) => {
            e.stopPropagation();
            const user = window.auth.currentUser;
            let userPlanFromFirestore = 'sem plano'; 
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    const response = await fetch(`${BACKEND_URL}/api/status`, {
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        userPlanFromFirestore = data.user_plan; 
                    } else {
                        console.error('handleTypeSelection: Erro ao buscar status do plano do usuário:', response.status);
                    }
                } catch (error) {
                    console.error('handleTypeSelection: Erro na requisição de status do plano:', error);
                }
            }
            if (userPlanFromFirestore === 'Plano Premium' || userPlanFromFirestore === 'Plano Essencial' || userPlanFromFirestore === 'Plano Básico') { 
                closeModal(chooseTypeModal);
                const type = card.dataset.type; 
                if (type === 'personal') {
                    openModal(personalMonitoramentoModal);
                } else if (type === 'radar') {
                    openModal(radarMonitoramentoModal);
                }
            } else {
                window.location.href = 'planos.html';
                closeModal(chooseTypeModal);
            }
        };
        if (btnSelectType) btnSelectType.addEventListener('click', handleTypeSelection);
        if (btnSelectType1) btnSelectType1.addEventListener('click', handleTypeSelection);
    });

    if (personalMonitoringForm) {
        personalMonitoringForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const link = document.getElementById('personal-link').value;
            const id = document.getElementById('personal-id').value;
            const name = document.getElementById('personal-name').value;
            if (!link || !id || !name) {
                alert('Por favor, preencha todos os campos obrigatórios para Monitoramento Pessoal.');
                return;
            }
            const user = window.auth.currentUser;
            if (!user) {
                alert("Você não está logado.");
                return;
            }
            const idToken = await user.getIdToken();
            try {
                const response = await fetch(`${BACKEND_URL}/api/monitoramentos/pessoal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ link_diario: link, id_edital: id, nome_completo: name })
                });
                if (await handleApiAuthError(response)) return;
                if (response.status === 201) {
                    closeModal(personalMonitoramentoModal);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress({ message: "Monitoramento ativado com sucesso." });
                } else if (response.ok) {
                    const result = await response.json();
                    closeModal(personalMonitoramentoModal);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress(result);
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao criar monitoramento pessoal: ${errorData.detail || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error('Erro na requisição para criar monitoramento pessoal:', error);
                alert('Ocorreu um erro ao se conectar com o servidor. Verifique se o backend está rodando.');
            }
        });
    }

    if (radarMonitoringForm) {
        radarMonitoringForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const link = document.getElementById('radar-link').value;
            const id = document.getElementById('radar-id').value;
            if (!link || !id) {
                alert('Por favor, preencha todos os campos obrigatórios para Monitoramento Radar.');
                return;
            }
            const user = window.auth.currentUser;
            if (!user) {
                alert("Você não está logado.");
                return;
            }
            const idToken = await user.getIdToken();
            try {
                const response = await fetch(`${BACKEND_URL}/api/monitoramentos/radar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ link_diario: link, id_edital: id })
                });
                if (await handleApiAuthError(response)) return;
                if (response.status === 201) {
                    closeModal(radarMonitoramentoModal); 
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress({ message: "Monitoramento ativado com sucesso." });
                } else if (response.ok) {
                    const result = await response.json();
                    closeModal(radarMonitoringForm); 
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress(result);
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao criar monitoramento radar: ${errorData.detail || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error('Erro na requisição para criar monitoramento radar:', error);
                alert('Ocorreu um erro ao se conectar com o servidor. Verifique se o backend está rodando.');
            }
        });
    }

    // NOVA FUNÇÃO: VERIFICAÇÃO ATUALIZADA DO PROVEDOR DE LOGIN
    function checkAuthProviderAndRenderSecurityTab() {
        const user = window.auth.currentUser;
        if (!user) return;
        
        // Verificamos diretamente se o provedor 'password' está na lista de provedores da conta.
        const hasPasswordProvider = user.providerData.some(provider => provider.providerId === 'password');
        
        if (hasPasswordProvider) {
            // Se tem o provedor de senha, mostra o formulário de alteração.
            if (changePasswordForm) changePasswordForm.style.display = 'block';
            if (createPasswordContainer) createPasswordContainer.style.display = 'none';
        } else {
            // Se não tem, mostra o formulário de criação.
            if (changePasswordForm) changePasswordForm.style.display = 'none';
            if (createPasswordContainer) createPasswordContainer.style.display = 'block';
        }
    }
    
    // NOVO: Listeners para o Modal de Perfil
    if (openProfileModalBtn) {
        openProfileModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(profileModal);
            fetchUserProfile(); 
            // A verificação da aba de segurança foi movida para o listener das abas
        });
    }
    
    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove a classe 'active' de todos os botões e conteúdos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Adiciona a classe 'active' apenas ao botão e conteúdo clicados
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');

                // Chama a função de verificação do provedor de login somente se a aba de segurança for a selecionada
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
    
    // NOVO: Listeners para as novas funcionalidades
    if (editAvatarBtn && profileImageUploadInput) {
        editAvatarBtn.addEventListener('click', () => {
            profileImageUploadInput.click();
        });
    }

    if (profileImageUploadInput) {
        profileImageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Pré-visualiza a imagem
                    profileImagePreview.src = event.target.result;
                    profileImagePreview.style.display = 'block';
                    profileDefaultAvatar.style.display = 'none';

                    // Chama a função de upload
                    uploadProfilePicture(file); 
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (passwordToggleButtons) {
        passwordToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    if (monitoringListSection) { monitoringListSection.addEventListener('change', (e) => { if (e.target.matches('input[type="checkbox"][id^="toggle-monitoramento-"]')) { const monitoringId = e.target.dataset.id; const isActive = e.target.checked; toggleMonitoringStatus(monitoringId, isActive); } });
        monitoringListSection.addEventListener('click', (e) => { const targetButton = e.target.closest('.btn-action'); if (targetButton) { const monitoringId = targetButton.dataset.id; if (targetButton.classList.contains('btn-delete')) { deleteMonitoring(monitoringId); } else if (targetButton.classList.contains('btn-configure')) { console.log(`Botão "Configurar" clicado para ${monitoringId}! (Ainda não implementado)`); alert(`Configurar monitoramento ${monitoringId} - Funcionalidade em desenvolvimento.`); } else if (targetButton.classList.contains('btn-test')) { testMonitoring(monitoringId); } } }); }

    let pollingInterval;
    async function checkMonitoringsForUpdates() {
        const user = window.auth.currentUser;
        if (!user) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            return;
        }
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${BACKEND_URL}/api/monitoramentos`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) {
                console.error("Erro na verificação periódica de monitoramentos.");
                return;
            }
            const newMonitorings = await response.json();
            if (JSON.stringify(currentMonitorings) !== JSON.stringify(newMonitorings)) {
                console.log("Detectadas atualizações nos monitoramentos. Recarregando...");
                currentMonitorings = newMonitorings;
                window.loadDashboardDataAndRender();
setTimeout(() => {
    if (typeof syncAllFavoriteButtons === "function") syncAllFavoriteButtons();
}, 500);

            }
        } catch (error) {
            console.error("Erro durante a verificação de atualizações:", error);
        }
    }
    if (!pollingInterval) {
        pollingInterval = setInterval(checkMonitoringsForUpdates, 5000);
    }
    
    // NOVA LÓGICA: Edição de nome de usuário no local
    function handleEditUsername() {
        const usernameDisplay = document.getElementById('profile-username-display');
        const usernameWrapper = document.querySelector('.profile-username-wrapper');
        const currentUsername = usernameDisplay.textContent.replace('@', '').trim();
    
        // Cria um campo de input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentUsername;
        input.className = 'edit-username-input';
    
        // Substitui o span pelo input
        usernameWrapper.replaceChild(input, usernameDisplay);
        input.focus();
    
        // Cria botões de salvar e cancelar
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        saveBtn.className = 'save-username-btn';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.className = 'cancel-username-btn';
        
        // Esconde o botão do lápis e adiciona os botões de salvar/cancelar
        const editBtn = document.getElementById('editUsernameBtn');
        editBtn.style.display = 'none';
        usernameWrapper.appendChild(saveBtn);
        usernameWrapper.appendChild(cancelBtn);
    
        // Salva a alteração
        saveBtn.addEventListener('click', async () => {
            const newUsername = input.value.trim();
            if (newUsername && newUsername !== currentUsername) {
                await updateUsername(newUsername);
            }
            // Restaura a visualização
            restoreUsernameView(newUsername || currentUsername);
        });
    
        // Cancela a alteração
        cancelBtn.addEventListener('click', () => {
            restoreUsernameView(currentUsername);
        });
        
        // Salva ao pressionar 'Enter'
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
        
        // Restaura a visualização para o span original
        function restoreUsernameView(username) {
            usernameDisplay.textContent = `@${username}`;
            usernameWrapper.replaceChild(usernameDisplay, input);
            usernameWrapper.removeChild(saveBtn);
            usernameWrapper.removeChild(cancelBtn);
            editBtn.style.display = 'block';
        }
    }
    
    // NOVA LÓGICA: Função para atualizar o nome de usuário no backend
    async function updateUsername(newUsername) {
        const user = window.auth.currentUser;
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
                fetchUserProfile(); // Atualiza a tela com os dados mais recentes
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar o nome de usuário: ${errorData.detail || 'Erro desconhecido.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição para atualizar o nome de usuário:', error);
            alert('Ocorreu um erro ao se conectar com o servidor.');
        }
    }
    
    // Novo: Listener para o botão de edição do nome de usuário
    if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', handleEditUsername);
    }


        // --- Botão Voltar ao Topo ---
    const backToTopBtn = document.querySelector('.back-to-top-button');

    if (backToTopBtn) {
        // Mostrar/ocultar botão conforme rolagem
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        // Rolagem suave ao clicar
           // --- Botão Voltar ao Topo ---
    const backToTopBtn = document.querySelector('.back-to-top-button');

    if (backToTopBtn) {
        // Mostrar/ocultar botão conforme rolagem
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        // Rolagem suave ao clicar
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ====================== FAVORITOS COM FIRESTORE ======================

// ====================== FAVORITOS PERSISTENTES FIRESTORE ======================

const FAVORITE_KEY = "monitoramentosFavoritos";
let favoritos = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]");
const monitoramentoContainer = document.querySelector(".monitoramento-list-section");

// --- 🔹 Aplica o estado visual da estrela
function applyFavoriteState(btn, id) {
    if (!btn || !id) return;
    const icon = btn.querySelector("i");
    const isFav = favoritos.includes(id);

    btn.classList.toggle("active", isFav);
    if (icon) {
        icon.classList.toggle("fas", isFav); // ícone sólido
        icon.classList.toggle("far", !isFav); // ícone contorno
    }
}

// --- 🔹 Reordena cards (favoritos primeiro)
function reorderCards() {
    if (!monitoramentoContainer) return;
    const cards = [...monitoramentoContainer.querySelectorAll(".monitoramento-item-card")];
    cards.sort((a, b) => {
        const aFav = favoritos.includes(a.dataset.id);
        const bFav = favoritos.includes(b.dataset.id);
        return bFav - aFav; // favoritos primeiro
    });
    cards.forEach(card => monitoramentoContainer.appendChild(card));
}

// --- 🔹 Atualiza todas as estrelas
function syncAllFavoriteButtons() {
    monitoramentoContainer?.querySelectorAll(".favorite-btn").forEach(btn => {
        const card = btn.closest(".monitoramento-item-card");
        const id = card?.dataset.id;
        if (id) applyFavoriteState(btn, id);
    });
    reorderCards();
}

// --- 🔹 Salva favoritos no Firestore
async function saveFavoritesToFirestore() {
    const user = window.auth.currentUser;
    if (!user || !window.db) return;

    try {
        await window.db.collection("users").doc(user.uid).set(
            { favoritos },
            { merge: true } // não sobrescreve o resto do doc
        );
        console.log("✅ Favoritos salvos no Firestore:", favoritos);
    } catch (err) {
        console.error("❌ Erro ao salvar favoritos no Firestore:", err);
    }
}

// --- 🔹 Carrega favoritos do Firestore
async function loadFavoritesFromFirestore() {
    const user = window.auth.currentUser;
    if (!user || !window.db) return;

    try {
        const doc = await window.db.collection("users").doc(user.uid).get();
        if (doc.exists && Array.isArray(doc.data().favoritos)) {
            favoritos = doc.data().favoritos;
            localStorage.setItem(FAVORITE_KEY, JSON.stringify(favoritos));
            console.log("⭐ Favoritos carregados do Firestore:", favoritos);
            syncAllFavoriteButtons();
        } else {
            console.log("Nenhum favorito salvo no Firestore ainda.");
        }
    } catch (err) {
        console.error("Erro ao carregar favoritos:", err);
    }
}

// --- 🔹 Evento de clique na estrela
monitoramentoContainer?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".favorite-btn");
    if (!btn) return;

    e.preventDefault();
    const card = btn.closest(".monitoramento-item-card");
    const id = card?.dataset.id;
    if (!id) return;

    // Alterna estado local
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(f => f !== id);
    } else {
        favoritos.push(id);
    }

    // Atualiza visual e localStorage
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(favoritos));
    applyFavoriteState(btn, id);
    reorderCards();

    // Sincroniza no Firestore
    await saveFavoritesToFirestore();
});

// --- 🔹 Ao logar, carrega favoritos e aplica após render
window.auth.onAuthStateChanged(async (user) => {
    if (user) {
        await loadFavoritesFromFirestore();

        // garante que os favoritos sejam aplicados após render dos monitoramentos
        const checkRendered = setInterval(() => {
            const cards = monitoramentoContainer?.querySelectorAll(".monitoramento-item-card");
            if (cards && cards.length > 0) {
                syncAllFavoriteButtons();
                clearInterval(checkRendered);
            }
        }, 500);
    }
});

// --- 🔹 Estilos visuais
const style = document.createElement("style");
style.innerHTML = `
.favorite-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: #6c757d;
    transition: color 0.25s ease, transform 0.2s ease;
}
.favorite-btn.active i {
    color: #007bff !important;
    transform: scale(1.2);
}
.favorite-btn i {
    pointer-events: none;
    transition: transform 0.2s ease;
}
.favorite-btn:hover i {
    color: #0056b3;
}
.favorite-btn:active i {
    transform: scale(1.3);
}
`;
document.head.appendChild(style);

}


// ====================== EDIÇÃO DE MONITORAMENTOS CORRIGIDA ======================

// ==================== EDIÇÃO DE MONITORAMENTO (CORRIGIDO) ====================

// =======================
// 🔧 Função de Editar Monitoramento
// =======================
const monitoramentoContainer = document.querySelector(".monitoramento-list-section");

if (monitoramentoContainer) {
    monitoramentoContainer.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".edit-btn");
        if (!editBtn) return;

        e.preventDefault();

        const card = editBtn.closest(".monitoramento-item-card");
        if (!card) return;

        const monitoramentoId = card.dataset.id;
        const tipo = card.querySelector("h3")?.textContent.toLowerCase().includes("pessoal") 
            ? "pessoal" 
            : "radar";

        // Busca o usuário logado e o token Firebase
        const user = window.auth?.currentUser;
        if (!user) {
            alert("Você precisa estar logado para editar um monitoramento.");
            return;
        }
        const token = await user.getIdToken();

        // 🔄 Busca todos os monitoramentos e filtra o específico
        let dadosMonitoramento = null;
        try {
            const resp = await fetch(`${BACKEND_URL}/api/monitoramentos`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const lista = await resp.json();
                dadosMonitoramento = lista.find(m => m.id === monitoramentoId);
                if (!dadosMonitoramento) {
                    alert("Monitoramento não encontrado.");
                    return;
                }
            } else {
                alert("Erro ao buscar lista de monitoramentos.");
                return;
            }
        } catch (err) {
            console.error("Erro ao buscar monitoramentos:", err);
            alert("Erro ao buscar dados do monitoramento.");
            return;
        }

        // 🧩 Escolhe e abre o modal correto
        const modalId = tipo === "pessoal" ? "personal-monitoramento-modal" : "radar-monitoramento-modal";
        const modal = document.getElementById(modalId);
        if (!modal) return;

        document.querySelectorAll(".modal-overlay.show-modal").forEach(m => m.classList.remove("show-modal"));
        modal.classList.add("show-modal");
        document.body.style.overflow = "hidden";

        // ✏️ Preenche os campos com os dados atuais
        if (tipo === "pessoal") {
            modal.querySelector("#personal-link").value = dadosMonitoramento.official_gazette_link || "";
            modal.querySelector("#personal-id").value = dadosMonitoramento.edital_identifier || "";
            const nomeInput = modal.querySelector("#personal-name");
            if (nomeInput) {
                nomeInput.value = dadosMonitoramento.candidate_name || "";
                nomeInput.disabled = true; // 🔒 bloqueia edição
            }
        } else {
            modal.querySelector("#radar-link").value = dadosMonitoramento.official_gazette_link || "";
            modal.querySelector("#radar-id").value = dadosMonitoramento.edital_identifier || "";
        }

        // 🎨 Atualiza título e ícone conforme tipo
        const titulo = modal.querySelector(".modal-content h2");
        const icone = modal.querySelector(".modal-header-icon i");
        if (tipo === "pessoal") {
            titulo.textContent = "Monitoramento Pessoal";
            icone.className = "fas fa-user";
        } else {
            titulo.textContent = "Monitoramento Radar";
            icone.className = "fas fa-bullseye";
        }

        // 🔘 Atualiza botão para "Salvar Alterações"
        const actionBtn = modal.querySelector(".btn-create-monitoramento");
        if (!actionBtn) return;
        actionBtn.textContent = "Salvar Alterações";
        actionBtn.classList.add("btn-save-monitoramento");

        // Remove qualquer listener antigo
        const newActionBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

        // 💾 Evento para salvar alterações
        newActionBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const updatedData = tipo === "pessoal"
                ? {
                    link_diario: modal.querySelector("#personal-link").value.trim(),
                    id_edital: modal.querySelector("#personal-id").value.trim(),
                    nome_completo: modal.querySelector("#personal-name").value.trim()
                }
                : {
                    link_diario: modal.querySelector("#radar-link").value.trim(),
                    id_edital: modal.querySelector("#radar-id").value.trim()
                };

            if (!updatedData.link_diario || !updatedData.id_edital) {
                alert("⚠️ Preencha todos os campos obrigatórios!");
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${monitoramentoId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    alert("✅ Monitoramento atualizado com sucesso!");
                    modal.classList.remove("show-modal");
                    document.body.style.overflow = "";
                    if (typeof window.loadDashboardDataAndRender === "function") {
                        window.loadDashboardDataAndRender();
                    }
                } else {
                    const err = await response.json();
                    alert(`❌ Erro ao atualizar: ${err.detail || response.statusText}`);
                }
            } catch (err) {
                console.error("Erro ao atualizar monitoramento:", err);
                alert("⚠️ Erro de conexão com o servidor.");
            }
        });
    });
}
});