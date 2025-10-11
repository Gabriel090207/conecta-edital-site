document.addEventListener("DOMContentLoaded", () => {
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
  
        // Se o campo estiver vazio ou 0, aplica o valor padrão do plano
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
  
    // --- Executa ao abrir o modal (ou ao carregar a página) ---
    updateSlotVisibility();
  });
  