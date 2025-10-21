document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";
    const articlesContainer = document.getElementById('articles-container');

    // --- FUNÇÃO AUXILIAR PARA CALCULAR O TEMPO DE LEITURA (COMO SEGURANÇA) ---
    function calcularTempoDeLeitura(texto) {
        const palavrasPorMinuto = 100;
        const numeroDePalavras = texto.split(/\s+/).length;
        return Math.ceil(numeroDePalavras / palavrasPorMinuto);
    }
    // --- FIM DA FUNÇÃO AUXILIAR ---

    async function fetchAndRenderArticles() {
        articlesContainer.innerHTML = '<p class="loading-message">Carregando artigos...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/articles`);
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
                
                // --- INÍCIO DA SOLUÇÃO ---
                // Verifica se o tempo de leitura existe no objeto, caso contrário, calcula.
                const tempoLeitura = article.tempo_leitura || calcularTempoDeLeitura(article.conteudo);

                articleCard.innerHTML = `
                    <a href="artigo.html?id=${article.id}">
                        <div class="article-image-container">
                            <img src="capa.png" alt="Capa do artigo">
                        </div>
                        <div class="article-body">
                            <h3>${article.titulo}</h3>
                            <div class="article-footer">
                                <span class="author" >Por: ${article.autor}</span>
                                <p>
                                <span class="read-time" ></p> ${tempoLeitura} min. de leitura</span>
                                <span class="date" style="margin-left: 50px"> ${new Date(article.data_criacao).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </a>
                `;
                // --- FIM DA SOLUÇÃO ---
                articlesContainer.appendChild(articleCard);
            });
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            articlesContainer.innerHTML = '<p class="error-message">Erro ao carregar artigos. Tente novamente.</p>';
        }
    }

    fetchAndRenderArticles();
});