document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";

    async function fetchAndRenderArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            document.getElementById('page-title').textContent = 'Artigo não encontrado';
            document.getElementById('article-title').textContent = 'Artigo não encontrado';
            document.getElementById('article-body-content').innerHTML = '<p>O artigo que você está procurando não existe.</p>';
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/articles/${articleId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Artigo não encontrado.");
                }
                throw new Error(`Erro na API: ${response.status}`);
            }
            const article = await response.json();

            document.getElementById('page-title').textContent = `Conecta Edital - ${article.titulo}`;
            document.getElementById('article-title').textContent = article.titulo;
            document.getElementById('article-category').textContent = article.topico;
            document.getElementById('article-author').textContent = article.autor;
            document.getElementById('article-date').textContent = new Date(article.data_criacao).toLocaleDateString('pt-BR');
            
            // Esta é a linha que pega o tempo de leitura do backend.
            document.getElementById('article-read-time').textContent = `${article.tempo_leitura || 1} min. de leitura`;
            
            const conteudoBruto = article.conteudo;
            const linhas = conteudoBruto.split('\n');

            let htmlConteudo = '';
            linhas.forEach(linha => {
                if (linha.trim() !== '') {
                    htmlConteudo += `<p>${linha}</p>`;
                }
            });

            document.getElementById('article-body-content').innerHTML = htmlConteudo;
            
            fetchAndRenderSuggestedArticles(articleId);
            
        } catch (error) {
            console.error("Erro ao carregar o artigo:", error);
            document.getElementById('page-title').textContent = 'Erro ao carregar artigo';
            document.getElementById('article-title').textContent = 'Erro ao carregar artigo';
            document.getElementById('article-body-content').innerHTML = `<p>${error.message || 'Ocorreu um erro inesperado.'}</p>`;
        }
    }

    async function fetchAndRenderSuggestedArticles(currentArticleId) {
        const suggestedArticlesContainer = document.getElementById('suggested-articles-container');
        suggestedArticlesContainer.innerHTML = '<p class="loading-message">Carregando sugestões...</p>';

        try {
            const response = await fetch(`${BACKEND_URL}/articles`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allArticles = await response.json();

            const suggestedArticles = allArticles
                .filter(article => article.id !== currentArticleId)
                .slice(0, 3);

            suggestedArticlesContainer.innerHTML = '';
            if (suggestedArticles.length === 0) {
                suggestedArticlesContainer.innerHTML = '<p class="no-articles-message">Nenhuma sugestão encontrada.</p>';
                return;
            }

            suggestedArticles.forEach(article => {
                const articleCard = document.createElement('div');
                articleCard.classList.add('article-card');

                const dataCriacao = new Date(article.data_criacao).toLocaleDateString('pt-BR');
                const tempoLeitura = article.tempo_leitura || 1;

                articleCard.innerHTML = `
                    <a href="artigo.html?id=${article.id}">
                        <div class="article-image-container">
                            <img src="capa.png" alt="Capa do artigo">
                        </div>
                        <div class="article-body">
                            <h3>${article.titulo}</h3>
                            <div class="article-footer">
                                <span class="author">${article.autor}</span>
                                <span class="date">${dataCriacao}</span>
                                <span class="read-time">${tempoLeitura} min. de leitura</span>
                            </div>
                        </div>
                    </a>
                `;
                suggestedArticlesContainer.appendChild(articleCard);
            });
        } catch (error) {
            console.error("Erro ao carregar sugestões de artigos:", error);
            suggestedArticlesContainer.innerHTML = '<p class="error-message">Erro ao carregar sugestões.</p>';
        }
    }

    fetchAndRenderArticle();
});