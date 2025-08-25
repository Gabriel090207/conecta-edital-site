document.addEventListener('DOMContentLoaded', () => {
    // Exemplo de funcionalidade: Adicionar um efeito de hover dinâmico
    const articleCards = document.querySelectorAll('.article-card');

    articleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            console.log('Hovering over card');
        });

        card.addEventListener('mouseleave', () => {
            console.log('Leaving card');
        });
    });

    // Você pode adicionar mais funcionalidades aqui, como um menu hambúrguer para celular
});