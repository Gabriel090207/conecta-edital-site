// notificacoes.js
import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    doc
  } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
  import {
    getAuth,
    onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
  
  // Inicializa Firebase SDK
  const db = getFirestore();
  const auth = getAuth();
  
  let unsubscribe = null;
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("👤 Usuário autenticado, iniciando listener de notificações...");
      iniciarListenerNotificacoes(user.uid);
    } else {
      console.log("⚠️ Nenhum usuário logado — notificações desativadas.");
      pararListener();
    }
  });
  
  function iniciarListenerNotificacoes(uid) {
    const q = query(
      collection(db, "notifications", uid, "items"),
      orderBy("created_at", "desc")
    );
  
    unsubscribe = onSnapshot(q, (snapshot) => {
      const notificacoes = [];
      snapshot.forEach((docSnap) => {
        notificacoes.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
  
      renderizarNotificacoes(notificacoes);
    });
  }
  
  function pararListener() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
  
  function renderizarNotificacoes(lista) {
    const badge = document.querySelector(".notification-badge");
    const dropdown = document.querySelector(".notification-dropdown");
  
    if (!badge || !dropdown) return;
  
    // Conta não lidas
    const naoLidas = lista.filter(n => !n.is_read);
    badge.textContent = naoLidas.length > 0 ? naoLidas.length : "";
    badge.style.display = naoLidas.length > 0 ? "flex" : "none";
  
    // Monta o HTML
    if (lista.length === 0) {
      dropdown.innerHTML = `<div class="notif-empty">Sem notificações</div>`;
      return;
    }
  
    dropdown.innerHTML = lista.map(n => `
      <div class="notif-item ${n.is_read ? "" : "unread"}" data-id="${n.id}">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${formatarData(n.created_at)}</div>
      </div>
    `).join("");
  
    // Evento de clique em cada notificação
    dropdown.querySelectorAll(".notif-item").forEach(item => {
      item.addEventListener("click", async () => {
        const id = item.getAttribute("data-id");
        const notif = lista.find(n => n.id === id);
  
        // Marca como lida
        try {
          const user = auth.currentUser;
          if (user) {
            const docRef = doc(db, "notifications", user.uid, "items", id);
            await updateDoc(docRef, { is_read: true });
          }
        } catch (err) {
          console.error("Erro ao marcar notificação como lida:", err);
        }
  
        // Redireciona
        if (notif.link && notif.link !== "#") {
          window.location.href = notif.link;
        }
      });
    });
  }
  
  function formatarData(timestamp) {
    try {
      if (!timestamp) return "";
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const agora = new Date();
      const diff = (agora - date) / 1000; // em segundos
  
      if (diff < 60) return "agora";
      if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
  
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  }
  
  // Abre e fecha o menu de notificações
  document.addEventListener("DOMContentLoaded", () => {
    const icon = document.querySelector(".notification-icon");
    const dropdown = document.querySelector(".notification-dropdown");
  
    if (!icon || !dropdown) return;
  
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });
  
    document.addEventListener("click", () => {
      dropdown.classList.remove("active");
    });
  });
  