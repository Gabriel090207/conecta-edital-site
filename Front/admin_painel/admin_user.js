
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("edit-user-form");
  const slotWrapper = document.getElementById("slot-wrapper");
  const slotInput = document.getElementById("edit-user-slots");
  const decreaseBtn = document.getElementById("decrease-slots");
  const increaseBtn = document.getElementById("increase-slots");
  const planSelect = document.getElementById("edit-user-plan");

  // --- FUNÇÃO: Atualiza visibilidade e valor dos slots conforme o plano ---
  function updateSlotVisibility() {
    const plan = planSelect.value;

    if (plan === "premium") {
      // Premium não precisa de controle de slots
      slotWrapper.style.display = "none";
      slotInput.value = 0;
    } else {
      // Outros planos exibem o controle normalmente
      slotWrapper.style.display = "flex";
      const currentValue = parseInt(slotInput.value, 10) || 0;
      if (currentValue === 0) {
        if (plan === "essencial") slotInput.value = 3;
        else if (plan === "basico") slotInput.value = 5;
        else slotInput.value = 0;
      }
    }
  }

  // --- FUNÇÃO: Diminuir slots ---
  function decreaseSlots() {
    let value = parseInt(slotInput.value, 10);
    if (value > 0) slotInput.value = value - 1;
  }

  // --- FUNÇÃO: Aumentar slots ---
  function increaseSlots() {
    let value = parseInt(slotInput.value, 10);
    slotInput.value = value + 1;
  }

  // --- EVENTOS ---
  if (decreaseBtn) decreaseBtn.addEventListener("click", decreaseSlots);
  if (increaseBtn) increaseBtn.addEventListener("click", increaseSlots);
  if (planSelect) planSelect.addEventListener("change", updateSlotVisibility);

  updateSlotVisibility();

  // --- ENVIO DO FORMULÁRIO ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userUid = window.selectedUserId; // defina isso ao abrir o modal
    const fullName = document.getElementById("edit-user-name").value;
    const email = document.getElementById("edit-user-email").value;
    const planType = document.getElementById("edit-user-plan").value;
    const slotsValue = parseInt(slotInput.value, 10);

    const payload = {
        fullName: fullName,
        email: email,
        plan_type: planType,
        slots_disponiveis: parseInt(document.getElementById("edit-user-slots").value, 10)
      };
      

    try {
      const res = await fetch(`/admin/users/${userUid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Se precisar autenticação de admin, inclua aqui:
          // "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Usuário atualizado com sucesso!");
        console.log("Atualizado:", data);
      } else {
        alert(`Erro: ${data.detail || "Falha ao salvar alterações."}`);
      }
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      alert("Erro ao salvar alterações.");
    }
  });
});

