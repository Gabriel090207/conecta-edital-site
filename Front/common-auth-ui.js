// Front/common-auth-ui.js

window.auth = firebase.auth(); 

const userDropdownToggle = document.getElementById('user-dropdown-toggle');
const userProfilePicture = document.getElementById('userProfilePicture');
const userDefaultAvatar = document.getElementById('userDefaultAvatar');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const userFullNameSpan = document.getElementById('user-fullname');
const userUsernameSpan = document.getElementById('user-username');

// Adicionei novas variáveis para o plano do usuário no HTML
const userPlanDisplay = document.getElementById('user-plan-display');
const upgradePlanButton = document.getElementById('upgrade-plan-button');


// Função para buscar e renderizar os dados do dashboard
// Agora esta função é chamada apenas para carregar os dados no cabeçalho
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
        if (userDefaultAvatar && user.displayName) {
            userDefaultAvatar.textContent = user.displayName.charAt(0).toUpperCase();
        } else if (userDefaultAvatar && user.email) {
            userDefaultAvatar.textContent = user.email.charAt(0).toUpperCase();
        }
    }
    const displayName = user.displayName || user.email.split('@')[0];
    if (userNameDisplay) userNameDisplay.textContent = displayName;
    if (userEmailSpan) userEmailSpan.textContent = user.email;
    if (userFullNameSpan) userFullNameSpan.textContent = user.displayName || 'Nome Completo';
    if (userUsernameSpan) userUsernameSpan.textContent = user.email.split('@')[0];
}


window.auth.onAuthStateChanged(async (user) => {
    const currentPath = window.location.pathname;

    if (user) {
        fetchAndRenderHeaderData(user);

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

if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('logoutBtn: Clique no botão de logout detectado.');
        try {
            await window.auth.signOut();
            // A limpeza do chat agora é tratada principalmente pelo onAuthStateChanged
            // ao detectar que o usuário se deslogou.
            window.location.href = 'index.html';
        } catch (error) {
            console.error('logoutBtn: Erro ao deslogar:', error);
            alert('Ocorreu um erro ao deslogar. Tente novamente.');
        }
    });
}

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