// ==================== EDIÇÃO DE NOME DO MONITORAMENTO (TÍTULO SUPERIOR) ====================

document.addEventListener("DOMContentLoaded", () => {

    const BACKEND_URL = "https://conecta-edital-site-927y.onrender.com";
  
    // Função principal: ativa o modo de edição ao clicar no ícone de lápis
    function enableEditMonitoringName() {
      document.body.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".edit-monitoring-name-btn");
        if (!editBtn) return;
  
        const titleContainer = editBtn.closest(".monitoring-title-container");
        const titleTextEl = titleContainer.querySelector(".monitoring-name-text");
        const oldTitle = titleTextEl.textContent.trim();
        const monitoringId = editBtn.dataset.id;
  
        // Cria o campo de input inline
        const input = document.createElement("input");
        input.type = "text";
        input.value = oldTitle;
        input.className = "edit-monitoring-name-input";
  
        const saveBtn = document.createElement("button");
        saveBtn.className = "save-monitoring-name-btn";
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
  
        // Substitui o texto pelo input + botão
        titleContainer.innerHTML = "";
        titleContainer.appendChild(input);
        titleContainer.appendChild(saveBtn);
        input.focus();
  
        // Função para salvar alteração
        async function saveNewName() {
          const newTitle = input.value.trim() || oldTitle;
  
          // Atualiza visualmente
          titleContainer.innerHTML = `
            <span class="monitoring-name-text">${newTitle}</span>
            <button class="edit-monitoring-name-btn" data-id="${monitoringId}" title="Editar nome do monitoramento">
              <i class="fas fa-pencil-alt"></i>
            </button>
          `;
  
          // Envia para o backend se houver mudança
          if (newTitle !== oldTitle) {
            try {
              const user = window.auth.currentUser;
              if (!user) return alert("Você não está logado.");
              const token = await user.getIdToken();
  
              const response = await fetch(`${BACKEND_URL}/api/monitoramentos/${monitoringId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ nome_customizado: newTitle }),
              });
  
              if (response.ok) {
                const result = await response.json();
                console.log("✅ Nome atualizado:", result.nome_customizado);
              } else {
                const err = await response.json();
                console.error("❌ Erro ao atualizar nome:", err);
                alert(err.detail || "Erro ao atualizar nome.");
              }
            } catch (error) {
              console.error("Erro ao salvar novo nome:", error);
              alert("Erro ao se conectar com o servidor.");
            }
          }
        }
  
        // Eventos
        saveBtn.addEventListener("click", saveNewName);
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") saveNewName();
          if (ev.key === "Escape") {
            titleContainer.innerHTML = `
              <span class="monitoring-name-text">${oldTitle}</span>
              <button class="edit-monitoring-name-btn" data-id="${monitoringId}" title="Editar nome do monitoramento">
                <i class="fas fa-pencil-alt"></i>
              </button>
            `;
          }
        });
      });
    }
  
    // Inicializa a função
    enableEditMonitoringName();
  
    // --- CSS opcional ---
    const style = document.createElement("style");
    style.innerHTML = `
      .edit-monitoring-name-input {
        font-size: 18px;
        font-weight: 600;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 4px 8px;
        width: 220px;
      }
    
      .edit-monitoring-name-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #555;
        margin-left: 6px;
        font-size: 15px;
      }
      .edit-monitoring-name-btn:hover i {
        color: #007bff;
      }
    `;
    document.head.appendChild(style);
  
  });
  