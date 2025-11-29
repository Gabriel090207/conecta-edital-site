// ==============================
// CONFIGURAÇÕES INICIAIS
// ==============================
const API_BASE_URL = "https://conecta-edital-site-927y.onrender.com";
const MP_PUBLIC_KEY = "APP_USR-0cd403ef-0e63-465c-9d9d-67cdfd5f19a1";

const PLANS = {
  essencial_plan: {
    id: "essencial_plan",
    name: "Essencial",
    priceLabel: "R$ 15,90/mês",
    amount: 15.9,
    icon: "fas fa-shield-alt",
  },

  premium_plan: {
    id: "premium_plan",
    name: "Premium",
    priceLabel: "R$ 35,90/mês",
    amount: 35.9,
    icon: "fas fa-crown",
  }
};

// ==============================
// FUNÇÕES AUXILIARES
// ==============================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function $(selector) {
  return document.querySelector(selector);
}

// ==============================
// CARREGAMENTO INICIAL
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  await ensureUserLogged();

  const planId = getQueryParam("plan") || "essencial_plan";
  const selectedPlan = PLANS[planId];

  fillPlanSummary(selectedPlan);
  setupTermsAndButton();
  initMercadoPagoCheckout(selectedPlan);
});

// ==============================
// LOGIN OBRIGATÓRIO
// ==============================
async function ensureUserLogged() {
  return new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        alert("Você precisa estar logado para assinar.");
        window.location.href = "index.html";
      }
      resolve(user);
    });
  });
}

// ==============================
// RESUMO DO PLANO
// ==============================
function fillPlanSummary(plan) {
  $("#planName").textContent = plan.name;
  $("#planPrice").textContent = plan.priceLabel;
  $("#totalValue").textContent = plan.priceLabel;

  document.querySelector(".summary-icon i").className = plan.icon;
}

// ==============================
// TERMOS & BOTÃO
// ==============================
function setupTermsAndButton() {
  const checkbox = $("#termsCheckbox");
  const payButton = $("#payButton");

  payButton.disabled = true;

  checkbox.addEventListener("change", () => {
    payButton.disabled = !checkbox.checked;
    payButton.classList.toggle("disabled", !checkbox.checked);
  });
}

// ==============================
// MERCADO PAGO
// ==============================
function initMercadoPagoCheckout(plan) {
  const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });

  const cardForm = mp.cardForm({
    amount: String(plan.amount.toFixed(2)),
    autoMount: true,
  
    form: {
      id: "payment-form",
  
      cardholderName: {
        id: "cardholderName",
        placeholder: "Nome como no cartão",
      },
  
      cardNumber: {
        id: "cardNumber",
        placeholder: "0000 0000 0000 0000",
      },
  
      cardExpirationMonth: {
        id: "cardExpirationMonth",
      },
  
      cardExpirationYear: {
        id: "cardExpirationYear",
      },
  
      securityCode: {
        id: "cardCVC",
        placeholder: "CVC",
      },
  
      issuer: {
        id: "issuer",
      },
  
      installments: {
        id: "installments",
      },
    },
  
    callbacks: {
      onFormMounted: (error) => {
        if (error) console.warn("Erro ao montar o form:", error);
        else console.log("CardForm montado com sucesso!");
      },


      onSubmit: async (event) => {
        event.preventDefault();

        const payButton = $("#payButton");
        payButton.disabled = true;
        payButton.textContent = "Processando...";

        try {
          const data = cardForm.getCardFormData();

          const token = data.token;
          const paymentMethod = data.paymentMethodId;
          const issuerId = data.issuerId;

          if (!token) {
            alert("Erro ao gerar token do cartão.");
            payButton.disabled = false;
            payButton.textContent = "Monitorar Diário Oficial →";
            return;
          }

          const firebaseUser = firebase.auth().currentUser;
          const idToken = await firebaseUser.getIdToken();

          const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              plan_id: plan.id,
              card_token: token,
              payment_method_id: paymentMethod,
              issuer_id: issuerId
            })
          });

          const result = await response.json();

          if (!response.ok) {
            alert(result.message || result.detail || "Erro ao criar assinatura.");
            payButton.disabled = false;
            payButton.textContent = "Monitorar Diário Oficial →";
            return;
          }

          window.location.href = "sucesso.html";

        } catch (err) {
          console.error("Erro no pagamento:", err);
          alert("Erro inesperado ao processar assinatura.");
          payButton.disabled = false;
          payButton.textContent = "Monitorar Diário Oficial →";
        }
      }
    }
  });
}
