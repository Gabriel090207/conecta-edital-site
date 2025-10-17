window.auth = firebase.auth(); 

const userDropdownToggle = document.getElementById('user-dropdown-toggle');
const userProfilePicture = document.getElementById('userProfilePicture');
const userDefaultAvatar = document.getElementById('userDefaultAvatar');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtns = document.querySelectorAll('#logout-btn, .logout-link');
const userEmailSpan = document.getElementById('user-email');
const userFullNameSpan = document.getElementById('user-fullname');
const userUsernameSpan = document.getElementById('user-username');
const userPlanDisplay = document.getElementById('user-plan-display');
const upgradePlanButton = document.getElementById('upgrade-plan-button');


// Função para buscar e renderizar os dados do cabeçalho
async function fetchAndRenderHeaderData(user) {
    if (!user) return;

    if (user.photoURL) {
        if (userProfilePicture) {
            userProfilePicture.src = user.photoURL;
            userProfilePicture.style.display = 'block';
        }
        if (userDefaultAvatar) userDefaultAvatar.style.display = 'none';
    } else {
        if (userDefaultAvatar) userDefaultAvatar.style.display = 'block';
        if (userProfilePicture) userProfilePicture.style.display = 'none';
        
        // Pega o nome de exibição do Firebase ou do e-mail
        const displayName = user.displayName || user.email.split('@')[0];
        if (userDefaultAvatar) {
            userDefaultAvatar.textContent = displayName.charAt(0).toUpperCase();
        }
    }
    
    // Usa o nome de exibição para o menu
    const displayName = user.displayName || user.email.split('@')[0];
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    
    // Essas variáveis não parecem ter um elemento correspondente no seu HTML atual, 
    // mas a lógica está aqui caso você adicione os elementos depois.
    // if (userEmailSpan) userEmailSpan.textContent = user.email;
    // if (userFullNameSpan) userFullNameSpan.textContent = user.displayName || 'Nome Completo';
    // if (userUsernameSpan) userUsernameSpan.textContent = user.email.split('@')[0];
}


window.auth.onAuthStateChanged(async (user) => {
    const currentPath = window.location.pathname;
    const BACKEND_URL = "https://conecta-edital-site.onrender.com"; // Defina a URL do seu backend aqui

    if (user) {
        // --- NOVO: Sincroniza dados do Firebase com o Firestore ---
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${BACKEND_URL}/api/users/${user.uid}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (response.ok) {
                const firestoreUserData = await response.json();
                
                // Se o nome no Firestore não estiver definido, mas o displayName do Firebase existir, atualize o Firestore.
                // Isso resolve o problema de usuários que logaram com o Google mas não tiveram o nome salvo.
                if (!firestoreUserData.fullName && user.displayName) {
                    await fetch(`${BACKEND_URL}/api/users/update_profile`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                        body: JSON.stringify({ fullName: user.displayName })
                    });
                    console.log('Nome do Google sincronizado com o Firestore.');
                    // Após a sincronização, recarregue os dados para refletir a mudança
                    await window.loadDashboardDataAndRender();
                } else {
                     // Se o nome já existe, apenas atualiza a UI
                     fetchAndRenderHeaderData(user);
                }

            } else {
                console.error('Erro ao buscar dados do usuário do Firestore:', response.status);
            }
        } catch (error) {
            console.error('Erro na requisição para sincronizar dados do usuário:', error);
        }
        // --- FIM DA SINCRONIZAÇÃO ---

        // AQUI: Chamamos a função principal que fará toda a mágica no painel
        if (typeof window.loadDashboardDataAndRender === 'function') {
            await window.loadDashboardDataAndRender();
        }

        // NOVO: Chamamos a função para carregar o painel de administração
        if (typeof window.loadAdminPanelData === 'function') {
            await window.loadAdminPanelData(user);
        }

        // Se o usuário está logado, garante que o chat carregue o histórico dele
        if (typeof window.loadChatHistory === 'function') {
            window.loadChatHistory();
        }

        const openProfileModalLink = document.getElementById('open-profile-modal-btn');
        if (openProfileModalLink) {
            openProfileModalLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.loadUserProfile === 'function') {
                    window.loadUserProfile();
                }
            });
        }

    } else {
        // Se o usuário NÃO está logado, limpa o histórico do chat
        console.log('onAuthStateChanged: Usuário deslogado. Limpando histórico do chat.');
        if (typeof window.clearChatHistory === 'function') {
            window.clearChatHistory(); 
        }

        // Redireciona apenas se não estiver já na página de login/cadastro
        if (!currentPath.endsWith('/index.html')) {
            window.location.href = 'index.html';
        }
    }
});

logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Logout detectado.');
        try {
            await window.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao deslogar:', error);
            alert('Ocorreu um erro ao deslogar. Tente novamente.');
        }
    });
});


if (userDropdownToggle) {
    userDropdownToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const dropdownContent = userDropdownToggle.querySelector('.dropdown-content');
        if (dropdownContent) {
            dropdownContent.classList.toggle('show');
        }
    });

    window.addEventListener('click', function(event) {
        if (userDropdownToggle && !userDropdownToggle.contains(event.target)) {
            const dropdowns = document.querySelectorAll('.user-menu .dropdown-content');
            dropdowns.forEach(function(openDropdown) {
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            });
        }
    });
}