document.addEventListener("DOMContentLoaded", () => {
  console.log("📜 histórico.js carregado com estilo de painel lateral.");

  // Elemento raiz do painel
  const historicoPanel = document.createElement("div");
  historicoPanel.className = "historico-panel hidden";
  historicoPanel.innerHTML = `
    <div class="historico-overlay"></div>
    <div class="historico-container">
      <div class="historico-header">
        <h3><i class="fas fa-history"></i> Histórico de Ocorrências</h3>
        <button id="fechar-historico" class="fechar-historico-btn">&times;</button>
      </div>
      <div id="historico-lista" class="historico-lista">
        <p class="loading-text">Carregando histórico...</p>
      </div>
    </div>
  `;
  document.body.appendChild(historicoPanel);

  const overlay = historicoPanel.querySelector(".historico-overlay");
  const closeBtn = historicoPanel.querySelector("#fechar-historico");
  const historicoLista = historicoPanel.querySelector("#historico-lista");

  // Funções de exibir/ocultar painel
  function abrirHistorico() {
    historicoPanel.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function fecharHistorico() {
    historicoPanel.classList.add("hidden");
    document.body.style.overflow = "";
  }

  overlay.addEventListener("click", fecharHistorico);
  closeBtn.addEventListener("click", fecharHistorico);

  // Evento principal de clique
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".view-history-link");
    if (!btn) return;

    e.preventDefault();
    const card = btn.closest(".monitoramento-item-card");
    if (!card) return;

    const monitoramentoId = card.dataset.id;
    if (!monitoramentoId) {
      alert("ID do monitoramento não encontrado.");
      return;
    }

    abrirHistorico();
    historicoLista.innerHTML = `<p class="loading-text">Carregando histórico...</p>`;

    await carregarHistorico(monitoramentoId);
  });

  // Função para buscar histórico no backend
  async function carregarHistorico(monitoramentoId) {
    const user = window.auth?.currentUser;
    if (!user) {
      historicoLista.innerHTML = `<p class="error-text">❌ É necessário estar logado.</p>`;
      return;
    }

    const token = await user.getIdToken();

    try {
      // ⚙️ Ajuste de rota — use a rota correta do backend (verifique se é /ocorrencias ou /historico)
      const resp = await fetch(`${BACKEND_URL}/api/monitoramentos/${monitoramentoId}/historico`, {

        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        historicoLista.innerHTML = `<p class="error-text">❌ Erro: ${resp.statusText}</p>`;
        return;
      }

      const data = await resp.json();

      if (!data || data.length === 0) {
        historicoLista.innerHTML = `<p class="empty-text">Nenhuma ocorrência encontrada.</p>`;
        return;
      }

      renderizarHistorico(data);
    } catch (err) {
      console.error(err);
      historicoLista.innerHTML = `<p class="error-text">❌ Erro ao carregar histórico.</p>`;
    }
  }

  // Renderiza histórico no painel
  function renderizarHistorico(ocorrencias) {
    historicoLista.innerHTML = ocorrencias
      .map((oc) => {
        const data = oc.detected_at
          ? new Date(oc.detected_at._seconds * 1000).toLocaleString("pt-BR")
          : "Data desconhecida";

        return `
          <div class="historico-card">
            <div class="historico-info">
              <i class="fas fa-bell"></i>
              <div>
                <strong>Ocorrência detectada</strong>
                <p>${oc.description || "Sem detalhes disponíveis."}</p>
                <small>${data}</small>
              </div>
            </div>
            ${
              oc.link
                ? `<a href="${oc.link}" target="_blank" class="historico-link">Ver publicação</a>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }
});
