// ===============================
// monitoramento-editar.js
// ===============================

const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";
let monitoramentoEditando = null; // controla o modo edição

// 🔧 Evento para capturar clique no botão "⚙️ Configurar"
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-configure");
  if (!btn) return;

  const card = btn.closest(".monitoramento-item-card");
  if (!card) return;

  const monitoramentoId = card.dataset.id;
  const tipo = card.dataset.type === "personal" ? "pessoal" : "radar";

  const user = window.auth?.currentUser;
  if (!user) {
    alert("Você precisa estar logado.");
    return;
  }

  const token = await user.getIdToken();

  try {
    const resp = await fetch(`${BACKEND_URL}/api/monitoramentos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error("Erro ao buscar monitoramentos.");

    const lista = await resp.json();
    const dados = lista.find((m) => m.id === monitoramentoId);
    if (!dados) return alert("Monitoramento não encontrado.");

    abrirModalEdicao(dados, tipo);
  } catch (err) {
    console.error("Erro ao carregar monitoramento:", err);
    alert("Erro ao carregar monitoramento.");
  }
});

// 🧩 Abre o modal e preenche os dados
function abrirModalEdicao(dados, tipo) {
  const modal =
    tipo === "pessoal"
      ? document.getElementById("personal-monitoramento-modal")
      : document.getElementById("radar-monitoramento-modal");

  if (!modal) return;

  document.querySelectorAll(".modal-overlay.show-modal").forEach((m) =>
    m.classList.remove("show-modal")
  );
  modal.classList.add("show-modal");
  document.body.style.overflow = "hidden";

  if (tipo === "pessoal") {
    modal.querySelector("#personal-link").value = dados.official_gazette_link || "";
    modal.querySelector("#personal-id").value = dados.edital_identifier || "";
    modal.querySelector("#personal-name").value = dados.candidate_name || "";
  } else {
    modal.querySelector("#radar-link").value = dados.official_gazette_link || "";
    modal.querySelector("#radar-id").value = dados.edital_identifier || "";
  }

  // Altera cabeçalho
  const titulo = modal.querySelector(".modal-content h2");
  const icone = modal.querySelector(".modal-header-icon i");
  const botao = modal.querySelector(".btn-create-monitoramento");

  if (titulo)
    titulo.textContent =
      tipo === "pessoal"
        ? "Editar Monitoramento Pessoal"
        : "Editar Monitoramento Radar";
  if (icone)
    icone.className = tipo === "pessoal" ? "fas fa-user" : "fas fa-bullseye";

  // Troca botão
  const novoBotao = botao.cloneNode(true);
  novoBotao.textContent = "Salvar Alterações";
  novoBotao.classList.remove("btn-create-monitoramento");
  novoBotao.classList.add("btn-save-monitoramento");

  botao.replaceWith(novoBotao);

  monitoramentoEditando = { id: dados.id, tipo };
  novoBotao.addEventListener("click", salvarEdicaoMonitoramento);
}

// 💾 Função para salvar alterações (agora gera keywords automaticamente)
async function salvarEdicaoMonitoramento(e) {
  e.preventDefault();

  if (!monitoramentoEditando) return;

  const { id, tipo } = monitoramentoEditando;
  const modal =
    tipo === "pessoal"
      ? document.getElementById("personal-monitoramento-modal")
      : document.getElementById("radar-monitoramento-modal");

  const user = window.auth?.currentUser;
  if (!user) {
    alert("Você precisa estar logado.");
    return;
  }
  const token = await user.getIdToken();

  let payload;

  if (tipo === "pessoal") {
    const nome = modal.querySelector("#personal-name").value.trim();
    const idEdital = modal.querySelector("#personal-id").value.trim();

    // 🔹 Mantém as palavras-chave separadas (nome e ID)
    const keywordsGeradas = [nome, idEdital];

    payload = {
      link_diario: modal.querySelector("#personal-link").value.trim(),
      id_edital: idEdital,
      nome_completo: nome,
      keywords: keywordsGeradas,
      palavras_chave: keywordsGeradas,
    };
  } else {
    const idEdital = modal.querySelector("#radar-id").value.trim();

    // 🔹 Gera as palavras-chave automaticamente com base no ID (relativo)
    const keywordsGeradas = idEdital;

    payload = {
      link_diario: modal.querySelector("#radar-link").value.trim(),
      id_edital: idEdital,
      keywords: keywordsGeradas,
      palavras_chave: keywordsGeradas,
    };
  }

  if (!payload.link_diario || !payload.id_edital) {
    alert("⚠️ Preencha todos os campos obrigatórios!");
    return;
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/monitoramentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      alert("✅ Monitoramento atualizado com sucesso!");
      fecharModalEdicao(modal, tipo);
      if (typeof window.loadDashboardDataAndRender === "function") {
        window.loadDashboardDataAndRender();
      }
    } else {
      const err = await resp.json();
      alert(`❌ Erro ao atualizar: ${err.detail || resp.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao atualizar monitoramento:", error);
    alert("Erro ao atualizar monitoramento.");
  }
}

// 🔁 Restaura modal pro modo criar
function fecharModalEdicao(modal, tipo) {
  modal.classList.remove("show-modal");
  document.body.style.overflow = "";

  const titulo = modal.querySelector(".modal-content h2");
  const icone = modal.querySelector(".modal-header-icon i");
  const botao = modal.querySelector(".btn-save-monitoramento");

  if (titulo)
    titulo.textContent =
      tipo === "pessoal" ? "Monitoramento Pessoal" : "Monitoramento Radar";
  if (icone)
    icone.className = tipo === "pessoal" ? "fas fa-user" : "fas fa-bullseye";

  if (botao) {
    const novoBotao = botao.cloneNode(true);
    novoBotao.textContent = "Criar Monitoramento";
    novoBotao.classList.remove("btn-save-monitoramento");
    novoBotao.classList.add("btn-create-monitoramento");
    botao.replaceWith(novoBotao);
  }

  monitoramentoEditando = null;
}
