
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";

    const currentPlanCard = document.getElementById('current-plan-card');
    const plansContainer = document.querySelector('.plans-grid-index');
    const welcomeUserNameSpan = document.getElementById('welcome-user-name');
    
    // Novas referências para o modal de perfil e menu de usuário
    const profileModal = document.getElementById('profile-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
    const profilePicture = document.getElementById('profile-picture');
    const profileDefaultAvatar = document.getElementById('profile-default-avatar');
    const profileFullName = document.getElementById('profile-full-name');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profilePlan = document.getElementById('profile-plan');
    const profileDisplayView = document.getElementById('profile-display-view');
    const profileEditForm = document.getElementById('profile-edit-form');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const editUsernameInput = document.getElementById('edit-username');
    const editFullNameInput = document.getElementById('edit-full-name');
    const userProfilePicture = document.getElementById('userProfilePicture');
    const userDefaultAvatar = document.getElementById('userDefaultAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const olaUsuarioElement = document.querySelector('.dropdown-content .olausuario');

    // --- Funções Auxiliares de UI ---
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden'; // Evita rolagem do body
        } else {
            console.error("Erro: Tentativa de abrir um modal nulo.");
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            const anyModalOpen = document.querySelector('.modal-overlay.show-modal');
            if (!anyModalOpen) {
                document.body.style.overflow = ''; // Restaura rolagem do body
            }
        } else {
            console.error("Erro: Tentativa de fechar um modal nulo.");
        }
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

    function getPlanClass(plan_type) {
        switch (plan_type) {
            case 'premium':
                return 'premium-plan-text';
            case 'essencial':
                return 'essencial-plan-text';
            case 'gratuito':
            case 'Sem Plano':
            default:
                return 'no-plan-text';
        }
    }

    // --- FUNÇÕES DE PERFIL ---
    function fillProfileModal(userData) {
        const user = window.firebase.auth().currentUser;
        
        if (user && user.photoURL) {
            profilePicture.src = user.photoURL;
            profilePicture.style.display = 'block';
            profileDefaultAvatar.style.display = 'none';
        } else {
            profileDefaultAvatar.textContent = userData.fullName ? userData.fullName[0].toUpperCase() : 'U';
            profileDefaultAvatar.style.display = 'flex';
            profilePicture.style.display = 'none';
        }

        profileFullName.textContent = userData.fullName || 'Nome Completo';
        profileUsername.textContent = userData.username ? `@${userData.username}` : '';
        profileEmail.textContent = userData.email || 'N/A';
        
        const planDisplay = (userData.plan_type === 'gratuito') ? 'Sem Plano' : userData.plan_type;
        profilePlan.textContent = planDisplay;

        profilePlan.className = getPlanClass(userData.plan_type);

        editUsernameInput.value = userData.username || '';
        editFullNameInput.value = userData.fullName || '';
    }
    
    async function loadUserProfile() {
        const user = window.firebase.auth().currentUser;
        if (!user) {
            console.error("Usuário não autenticado.");
            return;
        }

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (await handleApiAuthError(response)) return;
            if (!response.ok) {
                throw new Error(`Erro ao buscar dados do perfil: ${response.status}`);
            }

            const userData = await response.json();
            fillProfileModal(userData);
            openModal(profileModal);

        } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error);
            alert("Ocorreu um erro ao carregar os dados do seu perfil.");
        }
    }

    async function saveUserProfile(newUsername, newFullName) {
        const user = window.firebase.auth().currentUser;
        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ 
                    username: newUsername,
                    fullName: newFullName
                })
            });

            if (await handleApiAuthError(response)) return;
            
            if (response.ok) {
                const updatedUserData = await response.json();
                alert("Perfil atualizado com sucesso!");
                
                fillProfileModal(updatedUserData);
                updateUserProfileUI(updatedUserData);

                profileDisplayView.style.display = 'flex';
                profileEditForm.style.display = 'none';
                editProfileBtn.style.display = 'inline-block';
                cancelEditBtn.style.display = 'none';
                saveProfileBtn.style.display = 'none';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro desconhecido ao atualizar perfil.');
            }

        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert(`Falha ao salvar perfil: ${error.message}`);
        }
    }

    function updateUserProfileUI(userData) {
        // Lógica para atualizar o menu do usuário na navbar
        const user = window.firebase.auth().currentUser;
        
        if (user && user.photoURL) {
            userProfilePicture.src = user.photoURL;
            userProfilePicture.style.display = 'block';
            userDefaultAvatar.style.display = 'none';
        } else {
            userDefaultAvatar.textContent = (userData.fullName ? userData.fullName[0].toUpperCase() : 'U');
            userDefaultAvatar.style.display = 'flex';
            userProfilePicture.style.display = 'none';
        }

        const displayName = userData.fullName || 'Usuário';
        userNameDisplay.textContent = displayName;

        if (welcomeUserNameSpan) {
        welcomeUserNameSpan.textContent = userData.username || userData.fullName || "Usuário";
    }

        if (olaUsuarioElement) {
            const firstName = displayName.split(' ')[0];
            olaUsuarioElement.textContent = `Olá, ${firstName}!`;
        }
    }


    // --- FUNÇÕES DA PÁGINA DE PLANOS ---
    async function loadUserPlanStatus() {
        const token = await getAuthToken();
        const user = window.firebase.auth().currentUser;

        if (!token || !user) {
            console.log("Usuário não autenticado. O card de plano atual não será exibido.");
            if (currentPlanCard) {
                currentPlanCard.style.display = 'none';
            }
            if (welcomeUserNameSpan) welcomeUserNameSpan.textContent = "Usuário";
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (await handleApiAuthError(response)) return;
            if (!response.ok) {
                throw new Error('Falha ao carregar status do usuário.');
            }

            const data = await response.json();
            const userPlan = data.user_plan;

            document.querySelectorAll('.plan-card-index').forEach(card => {
                const button = card.querySelector('.choose-plan-btn-index');
                const signedDiv = card.querySelector('.plan-status-signed-index');
                
                const userPlanNormalized = userPlan.toLowerCase().replace(/plano /g, '');
                
                if (button) {
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
                }
            });
            
            if (userPlan && userPlan !== 'Sem Plano' && currentPlanCard) {
                currentPlanCard.style.display = 'flex';
                // Use o nome do plano diretamente da API
                currentPlanNameSpan.textContent = userPlan;
            } else if (currentPlanCard) {
                currentPlanCard.style.display = 'none';
            }

        } catch (error) {
            console.error('Erro ao carregar o plano do usuário:', error);
            if (currentPlanCard) {
                currentPlanCard.style.display = 'none';
            }
        }
    }

    async function handlePlanButtonClick(planId) {
        const token = await getAuthToken();
        if (!token) {
            alert('Você precisa estar logado para assinar um plano.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    plan_id: planId,
                    user_email: window.firebase.auth().currentUser.email 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Falha ao criar a preferência de pagamento.');
            }

            const data = await response.json();
            window.location.href = data.checkout_url;

        } catch (error) {
            console.error('Erro ao processar o pagamento:', error);
            alert(`Erro: ${error.message}`);
        }
    }

    if (plansContainer) {
        plansContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.choose-plan-btn-index');
            if (button) {
                const planId = button.dataset.planId;
                handlePlanButtonClick(planId);
            }
        });
    }

    // --- Listeners de Eventos Gerais ---
    if (typeof window.firebase !== 'undefined' && typeof window.firebase.auth !== 'undefined') {
        window.firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                // Carrega o plano do usuário ao fazer login ou recarregar
                await loadUserPlanStatus();

                // Busca dados do usuário para o menu da navbar
                const token = await user.getIdToken();
                const userResponse = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                updateUserProfileUI(userData);
            } else {
                if (currentPlanCard) {
                    currentPlanCard.style.display = 'none';
                }
                if (welcomeUserNameSpan) welcomeUserNameSpan.textContent = "Usuário";
                if (olaUsuarioElement) olaUsuarioElement.textContent = "Olá, Usuário!";
            }
        });
    } else {
        loadUserPlanStatus();
    }

    // Adiciona listener para o botão de perfil
    const openProfileModalLink = document.getElementById('open-profile-modal-btn');
    if (openProfileModalLink) {
        openProfileModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadUserProfile();
        });
    }

    // Adiciona listeners para fechar modais
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modalId;
            const modalToClose = document.getElementById(modalId);
            closeModal(modalToClose);
        });
    });

    // Lógica de edição de perfil
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            profileDisplayView.style.display = 'none';
            profileEditForm.style.display = 'flex';
            editProfileBtn.style.display = 'none';
            cancelEditBtn.style.display = 'inline-block';
            saveProfileBtn.style.display = 'inline-block';
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            profileDisplayView.style.display = 'flex';
            profileEditForm.style.display = 'none';
            editProfileBtn.style.display = 'inline-block';
            cancelEditBtn.style.display = 'none';
            saveProfileBtn.style.display = 'none';
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const user = window.firebase.auth().currentUser;
            if (!user) {
                alert("Você não está logado.");
                return;
            }

            const newUsername = editUsernameInput.value.trim();
            const newFullName = editFullNameInput.value.trim();

            if (!newUsername || !newFullName) {
                alert("Nome de usuário e nome completo são obrigatórios.");
                return;
            }

            await saveUserProfile(newUsername, newFullName);
        });
    }
});