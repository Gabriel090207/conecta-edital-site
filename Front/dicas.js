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


    const db = firebase.firestore();

    let allDicas = [];

    // --- Funções de Modal ---
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('show-modal');
            document.body.style.overflow = 'hidden';   // BLOQUEIA ROLAGEM DO FUNDO
        }
    }
    
    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('show-modal');
            document.body.style.overflow = 'auto';     // LIBERA ROLAGEM DO FUNDO
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
   // --- Lógica do Modal de Visualização ---
function openDicaViewerModal(dica) {

    console.log("🔎 ID recebido da dica:", dica.id);


    // Preencher título, autor e data
    dicaViewerTitle.textContent = dica.titulo;
    dicaViewerAutor.textContent = dica.autor;
    dicaViewerDate.textContent = new Date(dica.data_criacao).toLocaleDateString('pt-BR');

    // Converte quebras de linha para <p>
    const linhas = dica.conteudo.split('\n');
    let htmlConteudo = '';
    linhas.forEach(linha => {
        if (linha.trim() !== '') {
            htmlConteudo += `<p>${linha}</p>`;
        }
    });
    dicaViewerConteudo.innerHTML = htmlConteudo;

    // ==========================
    // 🔵 REGISTRAR VISUALIZAÇÃO
    // ==========================
    registrarVisualizacao(dica.id, dica);

    // ==========================
    // 🟢 CONFIGURAR BOTÃO "ÚTIL"
    // ==========================
   setTimeout(() => {
    const likeBtn = document.getElementById("btn-like");
    const likeCount = document.getElementById("like-count");
    db.collection("dicas").doc(dica.id).get().then(doc => {
    if (doc.exists) {
        const atual = doc.data().likes || 0;
        likeCount.textContent = atual;
        dica.likes = atual; // atualiza localmente
    }
});


    const uid = firebase.auth().currentUser?.uid;
    if (!uid) return;

    const likeUserRef = db.collection("dicas").doc(dica.id).collection("likes_users").doc(uid);

    // Verificar se o usuário já curtiu
    likeUserRef.get().then(doc => {
        if (doc.exists) {
            likeBtn.classList.add("liked");
        }
    });

    likeBtn.onclick = () => registrarCurtida(dica.id, dica);
}, 50);


// 🟦 CONFIGURAR BOTÃO DE COMPARTILHAR
const shareBtn = document.getElementById("btn-share");

shareBtn.onclick = () => {
    compartilharDica(dica);
};



    // Abrir modal
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



    // =============================
// 🔵 SALVAR VISUALIZAÇÃO
// =============================
function registrarVisualizacao(id, dicaObj) {
    const ref = db.collection("dicas").doc(id);

    ref.update({
        visualizacoes: firebase.firestore.FieldValue.increment(1)
    })
    .then(() => {
        // Atualiza localmente também
        dicaObj.visualizacoes = (dicaObj.visualizacoes || 0) + 1;

        // Atualizar no modal
        document.getElementById("dica-visualizacoes").textContent =
            `${dicaObj.visualizacoes} visualizações`;
    })
    .catch(() => {});
}


// =============================
// 🟢 SALVAR CURTIDA (Útil)
// =============================
function registrarCurtida(id, dicaObj) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Faça login para curtir.");
        return;
    }

    const uid = user.uid;

    const ref = db.collection("dicas").doc(id);
    const likeUserRef = ref.collection("likes_users").doc(uid);

    // Verificar se o usuário já curtiu
    likeUserRef.get().then(doc => {
        if (doc.exists) {
            console.log("Usuário já curtiu.");
            return; // Impede curtida repetida
        }

        // Salvar que este usuário curtiu
        likeUserRef.set({ curtido: true });

        // Incrementar contador
        ref.update({
            likes: firebase.firestore.FieldValue.increment(1)
        })
        .then(() => {
            dicaObj.likes = (dicaObj.likes || 0) + 1;
            document.getElementById("like-count").textContent = dicaObj.likes;
        });
    });
}

function compartilharDica(dica) {

    const link = window.location.origin + "/dicas.html?id=" + dica.id;
    const titulo = dica.titulo;

    // 💙 1) Se o navegador suportar Web Share API
    if (navigator.share) {
        navigator.share({
            title: titulo,
            text: "Achei essa dica útil no Conecta Edital!",
            url: link
        })
        .catch(err => console.log("Compartilhamento cancelado", err));

        return;
    }

    // 💚 2) Caso contrário, copia o link automaticamente:
    navigator.clipboard.writeText(link)
        .then(() => {
            alert("🔗 Link copiado! Agora você pode colar e compartilhar onde quiser.");
        })
        .catch(() => {
            alert("Não foi possível copiar o link.");
        });
}


    // Início da aplicação
    loadDicas();
});