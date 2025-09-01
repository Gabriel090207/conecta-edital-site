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
            // ROTA CORRIGIDA AQUI
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
            document.getElementById('article-read-time').textContent = `${Math.ceil(article.conteudo.split(' ').length / 200)} min. de leitura`;
            
            // --- INÍCIO DA SOLUÇÃO PARA QUEBRA DE LINHA ---
            const conteudoBruto = article.conteudo;
            // Divide o texto em um array de linhas, usando a quebra de linha como separador.
            const linhas = conteudoBruto.split('\n');

            let htmlConteudo = '';
            linhas.forEach(linha => {
                // Para cada linha, cria um novo parágrafo (<p>)
                // A verificação 'trim() !== ''' impede que parágrafos vazios sejam criados
                if (linha.trim() !== '') {
                    htmlConteudo += `<p>${linha}</p>`;
                }
            });

            document.getElementById('article-body-content').innerHTML = htmlConteudo;
            // --- FIM DA SOLUÇÃO PARA QUEBRA DE LINHA ---
            
        } catch (error) {
            console.error("Erro ao carregar o artigo:", error);
            document.getElementById('page-title').textContent = 'Erro ao carregar artigo';
            document.getElementById('article-title').textContent = 'Erro ao carregar artigo';
            document.getElementById('article-body-content').innerHTML = `<p>${error.message || 'Ocorreu um erro inesperado.'}</p>`;
        }
    }

    fetchAndRenderArticle();
});