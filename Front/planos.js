document.addEventListener('DOMContentLoaded', () => {
    // --- Referências da página de planos ---
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";
    const currentPlanCard = document.getElementById('current-plan-card');
    const plansContainer = document.querySelector('.plans-grid-index');
    const welcomeUserNameSpan = document.getElementById('welcome-user-name');
    const currentPlanNameSpan = document.getElementById('current-plan-name');

    // --- Referências da modal de perfil (reutilizadas) ---
    const profileModal = document.getElementById('profile-modal');
    const openProfileModalBtn = document.getElementById('open-profile-modal-btn');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
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
    const profileImageUploadInput = document.getElementById('profileImageUpload');
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    const passwordToggleButtons = document.querySelectorAll('.toggle-password');
    const editUsernameBtn = document.getElementById('editUsernameBtn');
    
    // Variável global para armazenar o nome completo do usuário
    let currentUserName = '';

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
        });
        document.body.style.overflow = '';
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

    // --- FUNÇÕES DE PERFIL ---
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
            
            // Preenche os campos do formulário de informações
            profileFullNameInput.value = userData.fullName || '';
            profileContactInput.value = userData.contact || '';
            profileEmailInput.value = userData.email || '';
            
            // Salva o nome completo em uma variável global
            currentUserName = userData.fullName || '';

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
                } else {
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
                userDefaultAvatar.style.display = 'block';
                userDefaultAvatar.textContent = userData.fullName ? userData.fullName.charAt(0) : 'U';
            }
            userNameDisplay.textContent = userData.fullName || userData.username || 'Usuário';
            const olaUsuarioElement = document.querySelector('.dropdown-content .olausuario');
            if (olaUsuarioElement) {
                const firstName = (userData.fullName || 'Usuário').split(' ')[0];
                olaUsuarioElement.textContent = `Olá, ${firstName}!`;
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

    // --- LÓGICA ESPECÍFICA DA PÁGINA DE PLANOS ---
    async function loadPlanosPage() {
        const user = window.firebase.auth().currentUser;
        if (!user) {
            if (welcomeUserNameSpan) welcomeUserNameSpan.textContent = "Usuário";
            if (currentPlanCard) currentPlanCard.style.display = 'none';
            return;
        }

        try {
            const token = await user.getIdToken();
            const userResponse = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                const displayName = userData.fullName || userData.username || 'Usuário';
                if (welcomeUserNameSpan) welcomeUserNameSpan.textContent = displayName;
                updateUserProfileUI(userData);
            }

            const statusResponse = await fetch(`${BACKEND_URL}/api/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                const userPlan = statusData.user_plan;

                if (userPlan && userPlan !== 'Sem Plano' && currentPlanCard) {
                    currentPlanCard.style.display = 'flex';
                    currentPlanNameSpan.textContent = userPlan;
                } else if (currentPlanCard) {
                    currentPlanCard.style.display = 'none';
                }

                document.querySelectorAll('.plan-card-index').forEach(card => {
                    const button = card.querySelector('.choose-plan-btn-index');
                    const signedDiv = card.querySelector('.plan-status-signed-index');
                    const userPlanNormalized = userPlan.toLowerCase().replace(/plano /g, '');
                    
                    if (card.dataset.planId.includes(userPlanNormalized)) {
                        button.style.display = 'none';
                        if (!signedDiv) {
                            let newSignedDiv = document.createElement('div');
                            newSignedDiv.className = 'plan-status-signed-index';
                            newSignedDiv.innerHTML = '<i class="fas fa-check-circle"></i> Assinado';
                            card.appendChild(newSignedDiv);
                        }
                    } else {
                        button.style.display = 'block';
                        if (signedDiv) {
                            signedDiv.remove();
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Erro ao carregar a página de planos:', error);
            if (currentPlanCard) currentPlanCard.style.display = 'none';
            if (welcomeUserNameSpan) welcomeUserNameSpan.textContent = "Usuário";
        }
    }
    
    // --- LÓGICA DE EXECUÇÃO ---
    // Inicia o carregamento da página de planos
    loadPlanosPage();

    // Listener para o botão de perfil
    if (openProfileModalBtn) {
        openProfileModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(profileModal);
            fetchUserProfile(); // Garante que os dados do perfil estejam atualizados
        });
    }

    // Listener unificado para os botões de fechar modal (X) e botões "Cancelar"
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
});

// A partir daqui, as funções updateProfileInfo(), changePassword(), createPassword(),
// e handleEditUsername() são as mesmas do arquivo 'main.js' original.
// A lógica da modal foi unificada para funcionar em todas as páginas.

// As funções do monitoramento pessoal e radar não estão neste arquivo,
// pois são específicas para a página 'monitoramentos.html'.