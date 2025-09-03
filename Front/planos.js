document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";

    const currentPlanCard = document.getElementById('current-plan-card');
    const plansContainer = document.querySelector('.plans-grid-index');
    const welcomeUserNameSpan = document.getElementById('welcome-user-name');

    // Função para obter o token de autenticação
    async function getAuthToken() {
        const user = window.firebase.auth().currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    // Função para carregar o status do plano do usuário e atualizar os cards
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

        if (welcomeUserNameSpan && user.displayName) {
            welcomeUserNameSpan.textContent = user.displayName;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

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

    if (typeof window.firebase !== 'undefined' && typeof window.firebase.auth !== 'undefined') {
        window.firebase.auth().onAuthStateChanged(user => {
            if (user) {
                loadUserPlanStatus();
            } else {
                if (currentPlanCard) {
                    currentPlanCard.style.display = 'none';
                }
            }
        });
    } else {
        loadUserPlanStatus();
    }
});