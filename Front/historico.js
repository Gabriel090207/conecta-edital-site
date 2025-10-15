// ===============================
// histórico.js (Painel Lateral)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("📜 histórico.js carregado com estilo de painel lateral.");

  // Painel lateral do histórico
  const historicoPanel = document.createElement("div");
  historicoPanel.className = "historico-panel hidden";
  historicoPanel.innerHTML = `
    <div class="historico-overlay"></div>
    <div class="historico-container">
      <div class="historico-header">
        <h3> Histórico de Ocorrências</h3>
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

  // Funções de exibir/ocultar
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

  // Captura clique em "Ver Histórico"
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

  // Função principal para carregar histórico
  async function carregarHistorico(monitoramentoId) {
    const user = window.auth?.currentUser;
    if (!user) {
      historicoLista.innerHTML = `<p class="error-text">❌ É necessário estar logado.</p>`;
      return;
    }

    const token = await user.getIdToken();

    try {
      const resp = await fetch(`${BACKEND_URL}/api/monitoramentos/${monitoramentoId}/historico`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        historicoLista.innerHTML = `<p class="error-text">❌ Erro: ${resp.statusText}</p>`;
        return;
      }

      const data = await resp.json();
      console.log("🔍 Dados do histórico recebidos:", data);

      if (!data || data.occurrences === 0) {
        historicoLista.innerHTML = `<p class="empty-text">Nenhuma ocorrência encontrada.</p>`;
        return;
      }

      renderizarHistorico(data);
    } catch (err) {
      console.error(err);
      historicoLista.innerHTML = `<p class="error-text">❌ Erro ao carregar histórico.</p>`;
    }
  }

  // ===============================
  // Renderiza o histórico no painel lateral
  // ===============================
  function renderizarHistorico(data) {
    // Detecta se o backend retornou uma lista dentro de `data.data` ou `data.ocorrencias`
    const ocorrencias = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.ocorrencias)
      ? data.ocorrencias
      : [data];

    historicoLista.innerHTML = ocorrencias
      .map((oc) => {
        // 🕓 Corrigir formato da data
        let dataOcorrencia = "Data desconhecida";
        if (oc.detected_at || oc.last_checked_at) {
          try {
            const base = oc.detected_at || oc.last_checked_at;
            if (base._seconds) {
              dataOcorrencia = new Date(base._seconds * 1000).toLocaleString("pt-BR");
            } else {
              dataOcorrencia = new Date(base).toLocaleString("pt-BR");
            }
          } catch {
            dataOcorrencia = "Data inválida";
          }
        }

        // 🔗 Prioridade do link:
        // 1️⃣ pdf_real_link (novo campo do backend)
        // 2️⃣ official_gazette_link
        // 3️⃣ link ou last_pdf_hash
        let linkPdf =
          oc.pdf_real_link ||
          oc.official_gazette_link ||
          oc.link ||
          oc.last_pdf_hash;

        if (linkPdf) {
          if (!linkPdf.startsWith("http")) {
            linkPdf = `${BACKEND_URL}/pdfs/${linkPdf}`;
          }
        }

        return `
          <div class="historico-card">
            <div class="historico-info">
              <i class="fas fa-history"></i>
              <div>
                <strong>Ocorrência encontrada</strong>
                <p>ID do edital: <b>${oc.edital_identifier || "-"}</b></p>
                ${
                  linkPdf
                    ? `<p><a href="${linkPdf}" target="_blank" class="historico-link"><i class="fas fa-link historico-link" style="font-size: 12px; color: #0582ff !important; -webkit-text-stroke: 0px;"></i> Ver Ocorrência</a></p>`
                    : "<p><i>Sem link disponível</i></p>"
                }
                <small>Data da ocorrência: ${dataOcorrencia}</small>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }
});
