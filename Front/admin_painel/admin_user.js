document.addEventListener("DOMContentLoaded", () => {
  const decreaseBtn = document.getElementById("decrease-slots");
  const increaseBtn = document.getElementById("increase-slots");
  const slotInput = document.getElementById("edit-user-slots");
  const form = document.querySelector("form");

  if (!form) return;

  // Botão de diminuir slots
  decreaseBtn.addEventListener("click", () => {
    let value = parseInt(slotInput.value) || 0;
    if (value > 0) slotInput.value = value - 1;
  });

  // Botão de aumentar slots
  increaseBtn.addEventListener("click", () => {
    let value = parseInt(slotInput.value) || 0;
    slotInput.value = value + 1;
  });

  // Evento de envio do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userUid = form.dataset.userUid;
    const slots = parseInt(slotInput.value);

    if (!userUid) {
      alert("Erro: ID do usuário não encontrado.");
      return;
    }

    if (isNaN(slots) || slots < 0) {
      alert("Digite um número válido de slots.");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Ajuste conforme seu método de auth
      const response = await fetch(`/admin/users/${userUid}/slots`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ slots }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Slots atualizados para ${slots}!`);
      } else {
        alert(`❌ Erro: ${result.detail || "Falha ao atualizar slots."}`);
      }
    } catch (err) {
      console.error("Erro ao conectar com o servidor:", err);
      alert("Erro de conexão com o servidor.");
    }
  });
});
