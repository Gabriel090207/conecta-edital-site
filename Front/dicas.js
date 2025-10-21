// dicas.js

document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";

    const dicasListContainer = document.getElementById('dicas-list-container');
    const noArticlesMessage = document.getElementById('no-articles-message');
    const tagButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('dica-search-input');

    const dicaViewerModal = document.getElementById('dica-viewer-modal');
    const dicaViewerTitle = document.getElementById('dica-viewer-title');
    const dicaViewerAutor = document.getElementById('dica-viewer-autor');
    const dicaViewerDate = document.getElementById('dica-viewer-date');
    const dicaViewerConteudo = document.getElementById('dica-viewer-conteudo');

    let allDicas = [];

    // --- Funções de Modal ---
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            document.body.style.overflow = '';
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

    // --- Funções para carregar e renderizar dicas ---
    async function loadDicas() {
        dicasListContainer.innerHTML = '';
        noArticlesMessage.style.display = 'none';

        try {
            const response = await fetch(`${BACKEND_URL}/dicas`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allDicas = await response.json();
            applyFiltersAndSearch();
        } catch (error) {
            console.error("Erro ao carregar dicas:", error);
            dicasListContainer.innerHTML = '<p class="error-message">Erro ao carregar dicas. Tente novamente.</p>';
        }
    }

    function renderDicas(dicasToRender) {
        dicasListContainer.innerHTML = '';
        if (dicasToRender.length === 0) {
            noArticlesMessage.style.display = 'flex';
            return;
        }
        noArticlesMessage.style.display = 'none';

        dicasToRender.forEach(dica => {
            const dicaCard = document.createElement('div');
            dicaCard.classList.add('dica-card');
            
            const dataCriacao = new Date(dica.data_criacao).toLocaleDateString('pt-BR');
            const tagClass = `tag-${dica.topico.toLowerCase().replace(/ /g, '-')}`;

            // --- INÍCIO DA SOLUÇÃO PARA QUEBRA DE LINHA NO CARD ---
            // Substitui as quebras de linha (`\n`) por <br> e corta para 150 caracteres.
            const conteudoFormatadoParaCard = dica.conteudo.replace(/\n/g, '<br>').substring(0, 150);
            
            // Adiciona "..." somente se o conteúdo for maior que 150 caracteres.
            const exibirPontos = dica.conteudo.length > 150 ? '...' : '';
            // --- FIM DA SOLUÇÃO ---

            // Define ícones e cores
const topicStyles = {
  "Geral":    { icon: '<i class="fa-solid fa-globe"></i>', bg: "#d9f2f2", color: "#069999" },
  "Monitoramento": { icon: '<i class="fa-solid fa-chart-line"></i>', bg: "#e6f1fb", color: "#2b7de9" },
  "Estudos":  { icon: '<i class="fa-solid fa-book-open"></i>', bg: "#eaf5e8", color: "#3b7a2d" },
  "Notificação": { icon: '<i class="fa-solid fa-bell"></i>', bg: "#fffde7", color: "#fbc02d" },
  "Avançado": { icon: '<i class="fa-solid fa-star"></i>', bg: "#f4e3fa", color: "#8e24aa" }
};

const estilo = topicStyles[dica.topico] || { icon: "📄", bg: "#eee", color: "#555" };

dicaCard.innerHTML = `
    <div class="topic-badge" 
        style="background-color: ${estilo.bg}; color: ${estilo.color};">
        ${estilo.icon} ${dica.topico}
    </div>
    <h3>${dica.titulo}</h3>
    <p>${conteudoFormatadoParaCard}${exibirPontos}</p>
    <div class="card-footer">
        <span class="autor">Por: ${dica.autor}</span>
        <span class="data">${dataCriacao}</span>
    </div>
`;

            dicaCard.addEventListener('click', () => {
                openDicaViewerModal(dica);
            });
            dicasListContainer.appendChild(dicaCard);
        });
    }

    // --- Lógica de Filtros e Busca ---
    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function applyFiltersAndSearch() {
        let filteredDicas = [...allDicas];

        const searchTerm = normalizeString(searchInput.value);
        const activeTag = document.querySelector('.filter-btn.active').dataset.filter;

        // Filtra por termo de busca
        if (searchTerm) {
            filteredDicas = filteredDicas.filter(dica =>
                normalizeString(dica.titulo).includes(searchTerm) ||
                normalizeString(dica.conteudo).includes(searchTerm) ||
                normalizeString(dica.topico).includes(searchTerm)
            );
        }

        // Filtra por tag
        if (activeTag !== 'todos') {
            filteredDicas = filteredDicas.filter(dica => normalizeString(dica.topico) === normalizeString(activeTag));
        }

        renderDicas(filteredDicas);
    }
    
    // --- Lógica do Modal de Visualização (já corrigida anteriormente) ---
    function openDicaViewerModal(dica) {
        dicaViewerTitle.textContent = dica.titulo;
        dicaViewerAutor.textContent = `Por: ${dica.autor}`;
        dicaViewerDate.textContent = new Date(dica.data_criacao).toLocaleDateString('pt-BR');

        // --- SOLUÇÃO PARA QUEBRA DE LINHA NO MODAL ---
        const conteudoBruto = dica.conteudo;
        const linhas = conteudoBruto.split('\n');
        let htmlConteudo = '';
        linhas.forEach(linha => {
            if (linha.trim() !== '') {
                htmlConteudo += `<p>${linha}</p>`;
            }
        });
        dicaViewerConteudo.innerHTML = htmlConteudo;
        // --- FIM DA SOLUÇÃO ---

        openModal(dicaViewerModal);
    }

    // --- Listeners ---
    tagButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            tagButtons.forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            applyFiltersAndSearch();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFiltersAndSearch);
    }

    // Início da aplicação
    loadDicas();
});