document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos elementos HTML dos Cards de Resumo e Modais ---
    const slotsAvailableValue = document.getElementById('slots-available-value');
    const slotsFreeStatus = document.getElementById('slots-free-status');
    const monitorsCountValue = document.getElementById('monitors-count-value');
    const monitorsActiveStatus = document.getElementById('monitors-active-status');
    const monitoringListSection = document.getElementById('monitoring-list');
    const initialNoMonitoramentoMessage = document.getElementById('initial-no-monitoramento-message');

    // NOVAS REFERÊNCIAS PARA OS SPANS DENTRO DA SEÇÃO PRINCIPAL (SE EXISTIREM)
    const userEmailSpan = document.getElementById('user-email');
    const userFullNameSpan = document.getElementById('user-fullname');
    const userUsernameSpan = document.getElementById('user-username');

    // Referências para os elementos do card "Plano Atual"
    const planValue = document.getElementById('plan-value');
    const planStatus = document.getElementById('plan-status');
    const planIconWrapper = document.querySelector('.summary-card.current-plan .summary-icon-wrapper');
    const planIcon = planIconWrapper ? planIconWrapper.querySelector('i') : null;
    const currentPlanCard = document.querySelector('.summary-card.current-plan');

    // NOVAS REFERÊNCIAS para o ícone e wrapper do card "Slots Disponíveis"
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
            if (modalElement === personalMonitoramentoModal && personalMonitoringForm) personalMonitoringForm.reset();
            if (modalElement === radarMonitoramentoModal && radarMonitoringForm) radarMonitoringForm.reset();

            const anyModalOpen = document.querySelector('.modal-overlay.show-modal');
            if (!anyModalOpen) {
                document.body.style.overflow = ''; // Restaura rolagem do body
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

    /**
     * Função auxiliar para lidar com erros de autenticação da API.
     */
    async function handleApiAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            console.error("Token de autenticação inválido ou expirado. Redirecionando para login.");
            if (typeof window.auth !== 'undefined') { // Usando window.auth
                await window.auth.signOut(); // Usando window.auth
            }
            window.location.href = 'login-cadastro.html';
            return true;
        }
        return false;
    }

    // --- FUNÇÃO showUpgradeAlert ---
    function showUpgradeAlert() {
        window.location.href = 'planos.html';
    }

    /** Cria o elemento HTML de um item de monitoramento */
    function createMonitoringItemHTML(mon) {
        const itemCard = document.createElement('div');
        itemCard.classList.add('monitoramento-item-card');
        itemCard.dataset.id = mon.id;
        let titleIconClass = '';
        let typeBadgeText = '';
        let detailsHtml = '';
        if (mon.monitoring_type === 'personal') {
            titleIconClass = 'fas fa-bell';
            typeBadgeText = 'Pessoal';
            detailsHtml = `
                        <div class="detail-item"><i class="fas fa-user" style="text-shadow:
        -1px -1px 0 #a600e8ff,
        1px -1px 0 #a600e8ff,
        -1px 1px 0 #a600e8ff,
        1px 1px 0 #a600e8ff;"></i><span>Nome do Candidato(a)</span><p><strong>${mon.candidate_name || 'N/A'}</strong></p></div>
                        <div class="detail-item"><i class="fas fa-book-open" style=" text-shadow:
        -1px -1px 0 #07a8ff,
        1px -1px 0 #07a8ff,
        -1px 1px 0 #07a8ff,
        1px 1px 0 #07a8ff;"></i><span>Diário Oficial</span><p><a href="${mon.official_gazette_link || '#'}" target="_blank" class="link-diario">Acessar Diário Oficial</a></p></div>

                        <div class="detail-item"><i class="fas fa-id-card"></i><span>ID do Edital / Concurso</span><p ><strong >${mon.edital_identifier || 'N/A'}</strong></p></div>`;
        } else if (mon.monitoring_type === 'radar') {
            titleIconClass = 'fas fa-bell';
            typeBadgeText = 'Radar';
            detailsHtml = `
                        <div class="detail-item"><i class="fas fa-id-card"></i><span>ID do Edital / Concurso</span><p><strong>${mon.edital_identifier || 'N/A'}</strong></p></div>

                    `;
        }
        itemCard.innerHTML = `
            <div class="item-header"><div class="item-header-title"><i class="${titleIconClass}"></i><h3>Monitoramento ${typeBadgeText} - ${mon.edital_identifier || mon.id}</h3><button class="edit-btn" data-id="${mon.id}" title="Editar monitoramento"><i class="fas fa-pencil-alt"></i></button><button class="favorite-btn" data-id="${mon.id}" title="Marcar como favorito"><i class="far fa-star"></i></button></div><span class="status-tag monitoring">${mon.status === 'active' ? 'Monitorando' : 'Inativo'}</span></div>
            <div class="item-details-grid">${detailsHtml}
                        <div class="detail-item"><i class="fas fa-clock" style=" text-shadow:
        -1px -1px 0 #230094ff,
        1px -1px 0 #230094ff,
        -1px 1px 0 #230094ff,
        1px 1px 0 #230094ff;"></i><span>Última Verificação</span><p><strong>${mon.last_checked_at ? new Date(mon.last_checked_at).toLocaleString('pt-BR') : 'Nunca verificado'}</strong></p></div>
                <div class="detail-item"><i class="fas fa-key"  style=" text-shadow:
        -1px -1px 0 #656766ff,
        1px -1px 0 #656766ff,
        -1px 1px 0 #656766ff,
        1px 1px 0 #656766ff;"></i><span>Palavras-chave Monitoradas</span><div class="keyword-tags"  > ${(mon.keywords || mon.candidate_name || '').split(',').map(k => `<span class="keyword-tag">${k.trim()}</span>`).join('')}</div></div>
                <div class="detail-item"><i class="fas fa-history" style=" text-shadow:
        -1px -1px 0 #009479ff,
        1px -1px 0 #009479ff,
        -1px 1px 0 #009479ff,
        1px 1px 0 #009479ff;"></i><span>Ocorrências</span><p class="occurrences-count"><strong>${mon.occurrences || 0} ocorrência(s)</strong> <a href="#" class="view-history-link">Ver Histórico</a></p></div>

                <div class="detail-item"><i class="fas fa-bell" style="text-shadow:
                   -1px -1px 0 #a600e8ff,
        1px -1px 0 #a600e8ff,
        -1px 1px 0 #a600e8ff,
        1px 1px 0 #a600e8ff;"></i><span>Status das Notificações</span><div class="notification-status"><span class="notification-tag email-enabled">Email</span><span class="notification-tag whatsapp-enabled">WhatsApp</span></div></div>
            </div>
            <div class="item-actions"><div class="toggle-switch"><input type="checkbox" id="toggle-monitoramento-${mon.id}" ${mon.status === 'active' ? 'checked' : ''} data-id="${mon.id}"><label for="toggle-monitoramento-${mon.id}">Ativo</label></div><div class="action-buttons"><button class="btn-action btn-configure" data-id="${mon.id}"><i class="fas fa-cog"></i> Configurar</button><button class="btn-action btn-test" data-id="${mon.id}"><i class="fas fa-play"></i> Testar</button><button class="btn-action btn-delete" data-id="${mon.id}"><i class="fas fa-trash-alt"></i> Excluir</button></div></div>
        `;
        return itemCard;
    }


    /**
     * NOVA FUNÇÃO PRINCIPAL: Carrega todos os dados do dashboard e renderiza a interface.
     * Chamada por common-auth-ui.js quando o usuário está logado.
     */
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

            // Renderiza os cards de resumo com os dados obtidos
            updateSummaryCards(statusData);
            
            // Renderiza a lista de monitoramentos
            loadMonitorings(monitoramentosList);
            
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            // Lida com erros na UI
            if (monitorsCountValue) monitorsCountValue.textContent = 'N/A';
            if (monitorsActiveStatus) monitorsActiveStatus.textContent = 'Erro';
            if (slotsAvailableValue) slotsAvailableValue.textContent = 'N/A';
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Erro';
            if (initialNoMonitoramentoMessage) initialNoMonitoramentoMessage.style.display = 'flex';
        }
    };


    /**
     * SIMPLIFICADA: Atualiza os cards de resumo no topo da página.
     * Recebe 'data' como parâmetro e NÃO FAZ mais chamadas de API.
     */
    function updateSummaryCards(data) {
        // Log para verificação do objeto de dados completo
        console.log("updateSummaryCards() foi chamada. Dados recebidos:", data);

        // O backend agora envia o nome de exibição do plano (ex: "Plano Premium", "Plano Essencial", "Sem Plano")
        const actualUserPlan = data.user_plan; 

        // Log para verificação do valor final do plano e da condição
        console.log("updateSummaryCards: Plano de usuário processado (nome de exibição):", actualUserPlan);
        console.log("updateSummaryCards: Resultado da verificação do plano (actualUserPlan === 'Plano Premium'):", actualUserPlan === 'Plano Premium');

        let canCreateNewMonitoring = true;

        // Lógica de adaptação dos cards baseada no nome de exibição do plano
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
                const createFirstMonitoramentoButton = initialNoMonitoramentoMessage.querySelector('#create-first-monitoramento-btn');
                if (createFirstMonitoramentoButton) {
                    createFirstMonitoramentoButton.href = '#';
                    createFirstMonitoramentoButton.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoButton.style.opacity = '1';
                    createFirstMonitoramentoButton.style.cursor = 'pointer';
                    createFirstMonitoramentoButton.disabled = false;
                }
            }
            canCreateNewMonitoring = true;

        } else if (actualUserPlan === 'Plano Essencial') { // Alterado para o nome de exibição
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
                const createFirstMonitoramentoButton = initialNoMonitoramentoMessage.querySelector('#create-first-monitoramento-btn');
                if (createFirstMonitoramentoButton) {
                    createFirstMonitoramentoButton.href = '#';
                    createFirstMonitoramentoButton.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoButton.style.opacity = '1';
                    createFirstMonitoramentoButton.style.cursor = 'pointer';
                    createFirstMonitoramentoButton.disabled = false;
                }
            }
            // LÓGICA DE VERIFICAÇÃO DE SLOTS DISPONÍVEIS
            canCreateNewMonitoring = data.slots_livres > 0;
            
        } else if (actualUserPlan === 'Plano Básico') { // Mantido para compatibilidade, mas pode ser removido se não for um plano ativo
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
                const createFirstMonitoramentoButton = initialNoMonitoramentoMessage.querySelector('#create-first-monitoramento-btn');
                if (createFirstMonitoramentoButton) {
                    createFirstMonitoramentoButton.href = '#';
                    createFirstMonitoramentoButton.innerHTML = '<i class="fas fa-plus"></i> Criar Meu Primeiro Monitoramento';
                    createFirstMonitoramentoButton.style.opacity = '1';
                    createFirstMonitoramentoButton.style.cursor = 'pointer';
                    createFirstMonitoramentoButton.disabled = false;
                }
            }
            // LÓGICA DE VERIFICAÇÃO DE SLOTS DISPONÍVEIS
            canCreateNewMonitoring = data.slots_livres > 0;
            
        } else { // Este bloco é para o "Sem Plano" (gratuito no backend, "Sem Plano" na UI)
            if (slotsAvailableValue) slotsAvailableValue.textContent = 0; // Corrigido para 0 slots
            if (slotsFreeStatus) slotsFreeStatus.textContent = 'Slots indisponíveis';
            if (slotsIcon) { slotsIcon.className = 'fas fa-times-circle'; slotsIcon.style.color = 'white'; } // Ícone de "X" para slots indisponíveis
            if (slotsIconWrapper) { slotsIconWrapper.classList.remove('gold-summary-bg', 'blue-summary-bg', 'green-summary-bg', 'orange-summary-bg'); slotsIconWrapper.classList.add('red-summary-bg'); }
            canCreateNewMonitoring = false;
            if (planValue) planValue.textContent = 'Sem Plano';
            if (planStatus) planStatus.textContent = 'Faça upgrade para criar monitoramentos'; 
            if (planIcon) { planIcon.className = 'fas fa-shield-alt'; planIcon.style.color = 'white'; } // Ícone de escudo
            if (planIconWrapper) { planIconWrapper.classList.remove('gold-summary-bg', 'green-summary-bg', 'blue-summary-bg', 'red-summary-bg'); planIconWrapper.classList.add('grey-summary-bg'); }
            if (currentPlanCard) { currentPlanCard.classList.remove('premium-plan-card', 'essencial-plan-card', 'basic-plan-card'); currentPlanCard.classList.add('no-plan-card'); }
            
            if (initialNoMonitoramentoMessage && initialNoMonitoramentoMessage.querySelector('p')) {
                const pElement = initialNoMonitoramentoMessage.querySelector('p');
                pElement.textContent = 'Você ainda não possui monitoramentos. Seus slots estão indisponíveis. Visite a página de planos para mais opções.';
                const createFirstMonitoramentoButton = initialNoMonitoramentoMessage.querySelector('#create-first-monitoramento-btn');
                if (createFirstMonitoramentoButton) {
                    createFirstMonitoramentoButton.href = 'planos.html';
                    createFirstMonitoramentoButton.innerHTML = 'Ver planos';
                    createFirstMonitoramentoButton.style.opacity = '1';
                    createFirstMonitoramentoButton.style.cursor = 'pointer';
                    createFirstMonitoramentoButton.disabled = false;
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
    
    /**
     * SIMPLIFICADA: Carrega a lista de monitoramentos.
     * Recebe a lista como parâmetro e NÃO FAZ mais chamadas de API.
     */
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
                setTimeout(nextStep, 1500); // tempo entre passos
            } else {
                // Esta é a parte que faltava! ✅
                // Finaliza a animação e fecha o modal
                const modalAtivado = document.getElementById('monitoramento-ativado-modal');
                
                // Recarrega os dados do dashboard para mostrar o novo monitoramento
                window.loadDashboardDataAndRender();
                
                // Fecha o modal após um pequeno atraso para que o usuário veja a conclusão.
                setTimeout(() => {
                    modalAtivado.classList.remove('show-modal');
                    document.body.style.overflow = '';
                }, 1000); // 1 segundo de espera
            }
        }
    
        nextStep();
    }


    /** Exclui um monitoramento via API e recarrega a lista */
    const deleteMonitoring = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este monitoramento?')) { return; }
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` } });
            if (await handleApiAuthError(response)) return; if (response.status === 204) { console.log(`Monitoramento ${id} excluído com sucesso!`); window.loadDashboardDataAndRender(); } else if (response.status === 404) { alert('Monitoramento não encontrado.'); console.warn(`Monitoramento ${id} não encontrado no backend.`); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao excluir.'); }
        } catch (error) { console.error("Erro ao excluir monitoramento:", error); alert(`Falha ao excluir monitoramento: ${error.message}`); }
    };

    /** Alterna o status (ativo/inativo) de um monitoramento via API */
    const toggleMonitoringStatus = async (id, isActive) => {
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }, body: JSON.stringify({ active: isActive }) });
            if (await handleApiAuthError(response)) return; if (response.ok) { console.log(`Monitoramento ${id} status alterado para ${isActive ? 'Ativo' : 'Inativo'}.`); const statusTag = document.querySelector(`[data-id="${id}"] .status-tag`); if (statusTag) { statusTag.textContent = isActive ? 'Monitorando' : 'Inativo'; } window.loadDashboardDataAndRender(); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao alternar status.'); }
        } catch (error) { console.error("Erro ao alternar status do monitoramento:", error); alert(`Falha ao alternar status: ${error.message}`); const checkbox = document.getElementById(`toggle-monitoramento-${id}`); if (checkbox) { checkbox.checked = !isActive; } }
    };

    /** Dispara uma verificação de teste para um monitoramento via API */
    const testMonitoring = async (id) => {
        const user = window.auth.currentUser;
        if (!user) { alert("Você não está logado."); return; } const idToken = await user.getIdToken();
        try { const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}/test`, { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` } });
            if (await handleApiAuthError(response)) return; if (response.ok) { const result = await response.json(); console.log(`Teste de monitoramento ${id} disparado com sucesso!`, result); alert('Teste de monitoramento iniciado! Verifique os logs do backend para o resultado e seu email se uma ocorrência for encontrada.'); } else { const errorData = await response.json(); throw new Error(errorData.detail || 'Erro desconhecido ao testar.'); }
        } catch (error) { console.error("Erro ao testar monitoramento:", error); alert(`Falha ao testar monitoramento: ${error.message}`); }
    };

    // --- Listeners de Eventos Globais (Modais e Formulários) ---

    // A lógica de autenticação inicial e carregamento de monitoramentos/cards de resumo
    // que estava aqui, agora será chamada pelo common-auth-ui.js
    // que garantirá que o usuário está logado antes de chamar as funções específicas.

    // Removendo listeners diretos que duplicam a lógica de updateSummaryCards
    if (openNewMonitoramentoModalBtn) {
        openNewMonitoramentoModalBtn.removeEventListener('click', showUpgradeAlert);
        openNewMonitoramentoModalBtn.removeEventListener('click', () => openModal(chooseTypeModal));
        // O listener correto será adicionado DENTRO da função updateSummaryCards
    }
    if (createFirstMonitoramentoBtn) {
        createFirstMonitoramentoBtn.removeEventListener('click', showUpgradeAlert);
        createFirstMonitoramentoBtn.removeEventListener('click', () => openModal(chooseTypeModal));
        // O listener correto será adicionado DENTRO da função updateSummaryCards
    }

    modalCloseButtons.forEach(btn => { btn.addEventListener('click', (e) => { const modalId = e.currentTarget.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });
    if (btnCancelModal) { btnCancelModal.addEventListener('click', () => { closeModal(chooseTypeModal); }); }
    btnCancelForms.forEach(btn => { btn.addEventListener('click', () => { closeModal(personalMonitoramentoModal); closeModal(radarMonitoramentoModal); openModal(chooseTypeModal); }); });
    document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', (e) => { if (e.target === overlay) { closeAllModals(); } }); });
    typeOptionCards.forEach(card => {
        const btnSelectType = card.querySelector('.btn-select-type');
        const btnSelectType1 = card.querySelector('.btn-select-type1');

        const handleTypeSelection = async (e) => {
            e.stopPropagation();

            // Obtém o plano do usuário do Firestore (o valor real do backend)
            const user = window.auth.currentUser;
            let userPlanFromFirestore = 'sem plano'; // Padrão
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    const response = await fetch(`${BACKEND_URL}/api/status`, {
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        // Pega o nome de exibição do plano diretamente do backend
                        userPlanFromFirestore = data.user_plan; 
                        console.log("handleTypeSelection: Plano do usuário do Firestore:", userPlanFromFirestore); // Log de depuração
                    } else {
                        console.error('handleTypeSelection: Erro ao buscar status do plano do usuário:', response.status);
                    }
                } catch (error) {
                    console.error('handleTypeSelection: Erro na requisição de status do plano:', error);
                }
            }

            // A lógica de permissão agora usa o NOME DE EXIBIÇÃO do plano
            if (userPlanFromFirestore === 'Plano Premium' || userPlanFromFirestore === 'Plano Essencial') { // 'Plano Básico' foi removido da condição
                console.log("handleTypeSelection: Plano permite criar monitoramento. Abrindo modal."); // Log de depuração
                closeModal(chooseTypeModal);
                const type = card.dataset.type; // Obtenha o tipo ANTES do if/else
                if (type === 'personal') {
                    openModal(personalMonitoramentoModal);
                } else if (type === 'radar') {
                    openModal(radarMonitoramentoModal);
                }
            } else {
                console.log("handleTypeSelection: Plano não permite criar monitoramento. Redirecionando para planos."); // Log de depuração
                // Redireciona para a página de planos se não tiver permissão
                window.location.href = 'planos.html';
                closeModal(chooseTypeModal); // Fecha o modal de escolha de tipo
            }
        };
        // Os listeners são adicionados uma vez e a função handleTypeSelection fará a verificação
        if (btnSelectType) btnSelectType.addEventListener('click', handleTypeSelection);
        if (btnSelectType1) btnSelectType1.addEventListener('click', handleTypeSelection);
    });

    // Enviar formulários de Monitoramento para o Backend
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
                    console.log('Monitoramento pessoal criado com sucesso!');
                    closeModal(personalMonitoramentoModal);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress({ message: "Monitoramento ativado com sucesso." });
                    window.loadDashboardDataAndRender(); // Recarrega os dados do dashboard
                } else if (response.ok) {
                    const result = await response.json();
                    console.log('Monitoramento pessoal criado com sucesso:', result);
                    closeModal(personalMonitoramentoModal);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress(result);
                    window.loadDashboardDataAndRender(); // Recarrega os dados do dashboard
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao criar monitoramento pessoal: ${errorData.detail || 'Erro desconhecido.'}`);
                    console.error('Erro ao criar monitoramento pessoal:', errorData);
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
                    console.log('Monitoramento radar criado com sucesso!');
                    closeModal(radarMonitoringForm);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress({ message: "Monitoramento ativado com sucesso." });
                    window.loadDashboardDataAndRender(); // Recarrega os dados do dashboard
                } else if (response.ok) {
                    const result = await response.json();
                    console.log('Monitoramento radar criado com sucesso:', result);
                    closeModal(radarMonitoringForm);
                    openModal(monitoramentoAtivadoModal);
                    startActivationProgress(result);
                    window.loadDashboardDataAndRender(); // Recarrega os dados do dashboard
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao criar monitoramento radar: ${errorData.detail || 'Erro desconhecido.'}`);
                    console.error('Erro ao criar monitoramento radar:', errorData);
                }
            } catch (error) {
                console.error('Erro na requisição para criar monitoramento radar:', error);
                alert('Ocorreu um erro ao se conectar com o servidor. Verifique se o backend está rodando.');
            }
        });
    }

    // Delegação de Eventos para Itens de Monitoramento Criados Dinamicamente
    if (monitoringListSection) { monitoringListSection.addEventListener('change', (e) => { if (e.target.matches('input[type="checkbox"][id^="toggle-monitoramento-"]')) { const monitoringId = e.target.dataset.id; const isActive = e.target.checked; toggleMonitoringStatus(monitoringId, isActive); } });
        monitoringListSection.addEventListener('click', (e) => { const targetButton = e.target.closest('.btn-action'); if (targetButton) { const monitoringId = targetButton.dataset.id; if (targetButton.classList.contains('btn-delete')) { deleteMonitoring(monitoringId); } else if (targetButton.classList.contains('btn-configure')) { console.log(`Botão "Configurar" clicado para ${monitoringId}! (Ainda não implementado)`); alert(`Configurar monitoramento ${monitoringId} - Funcionalidade em desenvolvimento.`); } else if (targetButton.classList.contains('btn-test')) { testMonitoring(monitoringId); } } }); }
});
