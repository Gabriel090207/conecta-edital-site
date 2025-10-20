document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
  
    // segurança: só executa se os elementos existem
    if (!menuToggle || !sidebar || !overlay) {
      console.warn("Navbar mobile: elementos não encontrados.");
      return;
    }
  
    // abre o menu
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden"; // bloqueia scroll do fundo
    });
  
    // fecha ao clicar fora
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    });
  
    // fecha ao apertar ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });


// === Sincroniza dados do usuário (foto e nome) com a sidebar ===
function syncUserToSidebar() {
    const mainAvatar = document.getElementById("userProfilePicture");
    const mainName = document.getElementById("userNameDisplay");
  
    const sidebarAvatar = document.getElementById("sidebarUserAvatar");
    const sidebarName = document.getElementById("sidebarUserName");
  
    if (mainAvatar && sidebarAvatar) {
      const src = mainAvatar.getAttribute("src");
      if (src && src.trim() !== "") {
        sidebarAvatar.src = src;
        sidebarAvatar.style.display = "block";
      } else {
        sidebarAvatar.src = "default-avatar.png"; // opcional: caminho do avatar padrão
      }
    }
  
    if (mainName && sidebarName) {
      const nome = mainName.textContent.trim();
      if (nome && nome !== "Carregando...") {
        sidebarName.textContent = nome;
      }
    }
  }
  
  // tenta sincronizar várias vezes (pra esperar o login carregar)
  document.addEventListener("DOMContentLoaded", () => {
    syncUserToSidebar();
    let attempts = 0;
    const interval = setInterval(() => {
      syncUserToSidebar();
      attempts++;
      if (attempts > 10) clearInterval(interval); // para após 10 tentativas (~5s)
    }, 500);
  });
  