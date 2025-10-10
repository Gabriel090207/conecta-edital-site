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
  const badge = document.querySelector(".notification-badge");
  const dropdown = document.querySelector(".notification-dropdown");
  if (!dropdown) return;

  // Conta notificações não lidas
  const naoLidas = lista.filter((n) => !n.is_read);
  atualizarBadge(naoLidas.length);

  // ==== HTML do dropdown ====
  let html = `
    <div class="notif-header">
      <i class="fa-regular fa-bell"></i>
      <span>Notificações</span>
    </div>
    <div class="notif-list">
  `;

  if (lista.length === 0) {
    html += `
      <div class="notif-empty">
        <i class="fa-solid fa-bell-slash"></i>
        <p>Nenhuma notificação nova</p>
      </div>`;
  } else {
    html += lista
      .map((n) => `
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
        </div>
      `)
      .join("");
  }

  html += `
    </div>
    <div class="notif-footer">
      <a href="/notificacoes">
        <i class="fa-regular fa-eye"></i>
        Ver todas as notificações ↗
      </a>
    </div>
  `;

  dropdown.innerHTML = html;
}

// ======================= FUNÇÕES DE SUPORTE =======================
function getNotifIconClass(title) {
  const t = title.toLowerCase();
  if (t.includes("dica")) return "fa-solid fa-lightbulb";
  if (t.includes("alerta")) return "fa-solid fa-triangle-exclamation";
  if (t.includes("erro")) return "fa-solid fa-circle-exclamation";
  if (t.includes("monitoramento")) return "fa-solid fa-chart-line";
  return "fa-regular fa-bell";
}

function getNotifColorClass(title) {
  const t = title.toLowerCase();
  if (t.includes("dica")) return "notif-blue";
  if (t.includes("alerta")) return "notif-orange";
  if (t.includes("erro")) return "notif-red";
  if (t.includes("monitoramento")) return "notif-green";
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

// Atualiza o badge (contador)
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

// ======================= MARCAR TODAS COMO LIDAS =======================
async function marcarTodasComoLidas() {
  const user = auth.currentUser;
  if (!user) return;

  const itemsRef = db.collection("notifications").doc(user.uid).collection("items");
  const snapshot = await itemsRef.where("is_read", "==", false).get();

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, { is_read: true });
  });

  if (!snapshot.empty) {
    await batch.commit();
  }
}

// ======================= DROPDOWN =======================
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.querySelector(".notification-icon");
  const dropdown = document.querySelector(".notification-dropdown");

  if (!icon || !dropdown) return;

  icon.addEventListener("click", async (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");

    // ao abrir, marca todas como lidas e limpa badge
    if (dropdown.classList.contains("active")) {
      await marcarTodasComoLidas();

      const badge = document.querySelector(".notification-badge");
      if (badge) {
        badge.classList.add("fade-out");
        setTimeout(() => badge.remove(), 300);
      }
    }
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
  });
});
