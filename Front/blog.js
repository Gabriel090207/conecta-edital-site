document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site.onrender.com";
    const articlesContainer = document.getElementById('articles-container');

    async function fetchAndRenderArticles() {
        articlesContainer.innerHTML = '<p class="loading-message">Carregando artigos...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/dicas`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const articles = await response.json();
            
            articlesContainer.innerHTML = ''; // Limpa a mensagem de carregamento
            if (articles.length === 0) {
                articlesContainer.innerHTML = '<p class="no-articles-message">Nenhum artigo publicado ainda.</p>';
                return;
            }

            articles.forEach(article => {
                const articleCard = document.createElement('div');
                articleCard.classList.add('article-card');
                
                // Mapeia os dados do artigo para a estrutura HTML
                articleCard.innerHTML = `
                    <a href="artigo.html?id=${article.id}">
                        <div class="article-image-container">
                            <img src="capa.png" alt="Capa do artigo">
                        </div>
                        <div class="article-body">
                            <h3>${article.titulo}</h3>
                            <div class="article-footer">
                                <span class="author">${article.autor}</span>
                                <span class="date">${new Date(article.data_criacao).toLocaleDateString('pt-BR')}</span>
                                <span class="read-time">6 min. de leitura</span>
                            </div>
                        </div>
                    </a>
                `;
                articlesContainer.appendChild(articleCard);
            });
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            articlesContainer.innerHTML = '<p class="error-message">Erro ao carregar artigos. Tente novamente.</p>';
        }
    }

    fetchAndRenderArticles();
});