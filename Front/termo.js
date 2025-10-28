// breadcrumb.js

document.addEventListener("DOMContentLoaded", () => {
    const previousUrl = document.referrer;
    const categoryElement = document.getElementById("article-category");
  
    if (previousUrl && categoryElement) {
      // Extrai o nome do arquivo da URL (ex: "monitoramento.html")
      const pageName = previousUrl.split("/").pop();
  
      // Remove a extensão .html
      const nameWithoutExtension = pageName.replace(".html", "");
  
      // Formata o nome (tira hífens e coloca maiúscula nas iniciais)
      const formattedName = nameWithoutExtension
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
  
      // Mostra o nome no breadcrumb
      categoryElement.textContent = formattedName;
    } else {
      categoryElement.textContent = "Artigo";
    }
  });
  