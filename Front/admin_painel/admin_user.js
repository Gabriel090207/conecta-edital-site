// ==========================
// 🧩 Controle de incremento/decremento de slots
// ==========================
document.getElementById("increase-slots").addEventListener("click", () => {
  const input = document.getElementById("edit-user-slots");
  input.value = parseInt(input.value) + 1;
});

document.getElementById("decrease-slots").addEventListener("click", () => {
  const input = document.getElementById("edit-user-slots");
  if (parseInt(input.value) > 0) input.value = parseInt(input.value) - 1;
});

// ==========================
// 🧩 Função para abrir o modal e carregar dados do usuário
// ==========================
async function openEditUserModal(userUid) {
  try {
    const res = await fetch(`/admin/users/${userUid}`); // rota para buscar dados de um usuário (ajuste se necessário)
    if (!res.ok) throw new Error("Erro ao carregar dados do usuário.");

    const user = await res.json();

    // Preenche campos no modal
    document.getElementById("edit-user-uid").value = userUid;
    document.getElementById("edit-user-fullName").value = user.fullName || "";
    document.getElementById("edit-user-email").value = user.email || "";
    document.getElementById("edit-user-plan").value = user.plan_type || "essencial";
    document.getElementById("edit-user-slots").value = user.slots ?? 0;

    // Exibe modal (se for manual)
    document.getElementById("user-edit-modal").style.display = "block";
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao carregar usuário: " + err.message);
  }
}

// ==========================
// 🧩 Função para salvar alterações (duas requisições)
// ==========================
document.querySelector(".btn-create").addEventListener("click", async (e) => {
  e.preventDefault();

  const userUid = document.getElementById("edit-user-uid").value;
  const fullName = document.getElementById("edit-user-fullName").value;
  const email = document.getElementById("edit-user-email").value;
  const planType = document.getElementById("edit-user-plan").value;
  const slotsValue = parseInt(document.getElementById("edit-user-slots").value);

  try {
    // 1️⃣ Atualiza dados principais
    const profileRes = await fetch(`/admin/users/${userUid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        plan_type: planType,
      }),
    });

    if (!profileRes.ok) throw new Error("Erro ao atualizar informações do usuário.");

    // 2️⃣ Atualiza slots
    const slotsRes = await fetch(`/admin/users/${userUid}/slots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: slotsValue }),
    });

    if (!slotsRes.ok) throw new Error("Erro ao atualizar slots do usuário.");

    alert("✅ Usuário atualizado com sucesso!");

    // Fecha o modal (opcional)
    document.getElementById("user-edit-modal").style.display = "none";
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao salvar alterações: " + err.message);
  }
});

// ==========================
// 🧩 (Opcional) Fechar modal ao clicar em Cancelar
// ==========================
document.querySelector(".btn-cancelar").addEventListener("click", () => {
  document.getElementById("user-edit-modal").style.display = "none";
});
