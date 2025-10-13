const db = firebase.firestore();
const auth = firebase.auth();

let unsubscribe = null;

// ======================= LOGIN E LISTENER =======================
auth.onAuthStateChanged((user) => {
  if (user) {
    iniciarListenerNotificacoes(user.uid);
  } else {
    pararListener();
  }
});

function iniciarListenerNotificacoes(uid) {
  const q = db
    .collection("notifications")
    .doc(uid)
    .collection("items")
    .orderBy("created_at", "desc");

  unsubscribe = q.onSnapshot((snapshot) => {
    const notificacoes = [];
    snapshot.forEach((docSnap) => {
      notificacoes.push({ id: docSnap.id, ...docSnap.data() });
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

// ======================= RENDERIZAR =======================
function renderizarNotificacoes(lista) {
  let dropdown = document.querySelector(".notification-dropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("notification-dropdown");
    document.body.appendChild(dropdown);
  }

  // 🔹 Filtra apenas notificações que ainda não foram removidas (não deletadas)
  const notificacoesAtivas = lista.filter((n) => !n.removed);
  const naoLidas = notificacoesAtivas.filter((n) => !n.is_read);
  atualizarBadge(naoLidas.length);

  let html = `
    <div class="notif-header">
      <i class="fa-regular fa-bell"></i>
      <span>Notificações</span>
    </div>
    <div class="notif-list">
  `;

  if (notificacoesAtivas.length === 0) {
    html += `
      <div class="notif-empty">
        <i class="fa-solid fa-bell-slash"></i>
        <p>Nenhuma notificação nova</p>
      </div>`;
  } else {
    html += notificacoesAtivas
      .map(
        (n) => `
        <div class="notif-card ${n.is_read ? "" : "unread"}" data-id="${n.id}">
          <div class="notif-left ${getNotifColorClass(n.title)}">
            <i class="${getNotifIconClass(n.title)}"></i>
          </div>
          <div class="notif-center">
            <div class="notif-title"><strong>${limparTexto(n.title)}</strong></div>
            <div class="notif-message">${limparTexto(n.message)}</div>
          </div>
          <div class="notif-right">
            <small>${formatarData(n.created_at)}</small>
          </div>
          <button class="notif-delete-btn" title="Excluir">×</button>
        </div>`
      )
      .join("");
  }

  html += `
    </div>
    <div class="notif-footer">
      <a href="#" class="ver-todas-btn">
        <i class="fa-regular fa-eye"></i> Ver todas as notificações ↗
      </a>
    </div>
  `;

  dropdown.innerHTML = html;

  // 🔹 Excluir do Firestore e atualizar a UI
  document.querySelectorAll(".notif-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = e.target.closest(".notif-card");
      const notifId = card.dataset.id;
      const user = auth.currentUser;
      if (!user || !notifId) return;

      try {
        // Marca como removida (não deleta do Firestore para manter histórico)
        await db
          .collection("notifications")
          .doc(user.uid)
          .collection("items")
          .doc(notifId)
          .update({ removed: true });

        card.remove();

        // Verifica se há notificações restantes
        const listaRestante = document.querySelectorAll(".notif-card");
        if (listaRestante.length === 0) {
          const listaEl = document.querySelector(".notif-list");
          if (listaEl) {
            listaEl.innerHTML = `
              <div class="notif-empty">
                <i class="fa-solid fa-bell-slash"></i>
                <p>Nenhuma notificação nova</p>
              </div>`;
          }
        }
      } catch (err) {
        console.error("Erro ao remover notificação:", err);
      }
    });
  });

  // 🔹 abre sidebar
  const verTodas = dropdown.querySelector(".ver-todas-btn");
  if (verTodas) {
    verTodas.addEventListener("click", (e) => {
      e.preventDefault();
      abrirSidebarNotificacoes();
      dropdown.classList.remove("active");
    });
  }
}

// ======================= FUNÇÕES AUXILIARES =======================
function getNotifIconClass(title) {
  const t = title.toLowerCase();
  if (t.includes("dica")) return "fa-solid fa-lightbulb";
  if (t.includes("alerta")) return "fa-solid fa-triangle-exclamation";
  if (t.includes("erro")) return "fa-solid fa-circle-exclamation";
  if (t.includes("ocorrência") || t.includes("ocorrencia"))
    return "fa-regular fa-bell";
  if (t.includes("artigo")) return "fa-solid fa-book-open";
  if (t.includes("suporte")) return "fa-solid fa-headset";
  return "fa-regular fa-bell";
}

function getNotifColorClass(title) {
  const t = title.toLowerCase();
  if (t.includes("dica")) return "notif-blue";
  if (t.includes("alerta") || t.includes("erro")) return "notif-red";
  if (t.includes("ocorrência") || t.includes("ocorrencia")) return "notif-orang";
  if (t.includes("artigo")) return "notif-green";
  if (t.includes("suporte")) return "notif-purple";
  return "notif-gray";
}

function formatarData(timestamp) {
  try {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const agora = new Date();
    const diff = (agora - date) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function limparTexto(texto) {
  if (!texto) return "";
  return texto
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g,
      ""
    )
    .replace(/[:]/g, "")
    .trim();
}

function atualizarBadge(qtd) {
  let badge = document.querySelector(".notification-badge");
  const bellIcon = document.querySelector(".notification-icon");
  if (!bellIcon) return;

  if (qtd <= 0) {
    if (badge) {
      badge.classList.add("fade-out");
      setTimeout(() => badge.remove(), 300);
    }
    return;
  }

  if (!badge) {
    badge = document.createElement("span");
    badge.classList.add("notification-badge");
    bellIcon.appendChild(badge);
  }

  badge.textContent = qtd > 99 ? "99+" : qtd;
  badge.classList.remove("fade-out");
}

// ======================= DROPDOWN =======================
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.querySelector(".notification-icon");
  let dropdown = document.querySelector(".notification-dropdown");

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("notification-dropdown");
    document.body.appendChild(dropdown);
  }

  if (!icon) return;

  icon.addEventListener("click", async (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
    if (dropdown.classList.contains("active")) {
      await marcarTodasComoLidas();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".notification-dropdown") &&
      !e.target.closest(".notification-icon")
    ) {
      dropdown.classList.remove("active");
    }
  });
});

// ======================= MARCAR COMO LIDAS =======================
async function marcarTodasComoLidas() {
  const user = auth.currentUser;
  if (!user) return;
  const itemsRef = db.collection("notifications").doc(user.uid).collection("items");
  const snapshot = await itemsRef.where("is_read", "==", false).get();
  const batch = db.batch();
  snapshot.forEach((doc) => batch.update(doc.ref, { is_read: true }));
  if (!snapshot.empty) await batch.commit();
}

// ======================= SIDEBAR (HISTÓRICO) =======================
function abrirSidebarNotificacoes() {
  let sidebar = document.getElementById("notif-sidebar");
  let overlay = document.getElementById("notif-overlay");

  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "notif-sidebar";
    sidebar.classList.add("notif-sidebar", "glass");
    sidebar.innerHTML = `
      <div class="notif-sidebar-header">
        <h3>Histórico de Notificações</h3>
        <button class="close-sidebar">&times;</button>
      </div>
      <div class="notif-sidebar-body">
        <p>Carregando...</p>
      </div>
    `;
    document.body.appendChild(sidebar);
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notif-overlay";
    overlay.classList.add("notif-overlay");
    document.body.appendChild(overlay);
  }

  sidebar.classList.add("show", "active");
  overlay.style.opacity = "1";
  overlay.style.visibility = "visible";

  carregarNotificacoesSidebar();

  sidebar.querySelector(".close-sidebar").onclick = () => fecharSidebarNotificacoes();
  overlay.onclick = () => fecharSidebarNotificacoes();
}

function fecharSidebarNotificacoes() {
  const sidebar = document.getElementById("notif-sidebar");
  const overlay = document.getElementById("notif-overlay");
  if (sidebar) sidebar.classList.remove("show", "active");
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
  }
}

async function carregarNotificacoesSidebar() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const container = document.querySelector(".notif-sidebar-body");
  const snapshot = await firebase.firestore()
    .collection("notifications")
    .doc(user.uid)
    .collection("items")
    .orderBy("created_at", "desc")
    .get();

  if (snapshot.empty) {
    container.innerHTML = "<p>Nenhuma notificação encontrada.</p>";
    return;
  }

  const grupos = { hoje: [], ontem: [], anteriores: [] };
  const agora = new Date();

  snapshot.forEach((doc) => {
    const n = doc.data();
    const data = n.created_at?.toDate?.() || new Date();
    const diffDias = Math.floor((agora - data) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) grupos.hoje.push(n);
    else if (diffDias === 1) grupos.ontem.push(n);
    else grupos.anteriores.push(n);
  });

  const gerarSecao = (titulo, lista) =>
    lista.length
      ? `
        <h4 class="notif-grupo-titulo">${titulo}</h4>
        ${lista
          .map(
            (n) => `
          <div class="notif-card">
            <div class="notif-left ${getNotifColorClass(n.title)}">
              <i class="${getNotifIconClass(n.title)}"></i>
            </div>
            <div class="notif-center">
              <div class="notif-title"><strong>${limparTexto(n.title)}</strong></div>
              <div class="notif-message">${limparTexto(n.message)}</div>
            </div>
            <div class="notif-right">
              <small>${formatarData(n.created_at)}</small>
            </div>
          </div>`
          )
          .join("")}`
      : "";

  container.innerHTML = `
    ${gerarSecao("Hoje", grupos.hoje)}
    ${gerarSecao("Ontem", grupos.ontem)}
    ${gerarSecao("Dias anteriores", grupos.anteriores)}
  `;
}
