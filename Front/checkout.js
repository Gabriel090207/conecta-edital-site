// ==============================
// CONFIGURAÇÕES INICIAIS
// ==============================

// URL do seu backend FastAPI (Render)
const API_BASE_URL = "https://conecta-edital-site-927y.onrender.com";

// ⚠️ Substitua pela sua PUBLIC_KEY do Mercado Pago
const MP_PUBLIC_KEY = "APP_USR-0cd403ef-0e63-465c-9d9d-67cdfd5f19a1";

// Mapeamento dos planos (precisa bater com o que você usa no backend)
const PLANS = {
  essencial_plan: {
    id: "essencial_plan",
    name: "Essencial",
    priceLabel: "R$ 15,90/mês",
    amount: 15.9,
    icon: "fas fa-shield-alt",
    benefits: [
      {
        icon: "fas fa-file-alt",
        title: "Monitoramento de Diários",
        subtitle: "Monitore até 3 Diários Oficiais"
      },
      {
        icon: "fas fa-envelope",
        title: "Notificação via E-mail",
        subtitle: "Receba atualização via e-mail"
      },
      {
        icon: "fas fa-user-large",
        title: "Suporte",
        subtitle: "Ajuda prioritária quando precisar"
      }
    ]
  },

  premium_plan: {
    id: "premium_plan",
    name: "Premium",
    priceLabel: "R$ 35,90/mês",
    amount: 35.9,
    icon: "fas fa-crown",
    benefits: [
      {
        icon: "fas fa-file-alt",
        title: "Monitoramento de Diários",
        subtitle: "Monitoramentos ilimitados"
      },
      {
        icon: "fas fa-envelope",
        title: "Notificação via E-mail",
        subtitle: "Receba atualização por e-mail"
      },
      {
        icon: "fab fa-whatsapp",
        title: "Notificação via WhatsApp",
        subtitle: "Receba notificações no seu celular"
      },
      {
        icon: "fas fa-user-shield",
        title: "Suporte Prioritário",
        subtitle: "Atendimento rápido e avançado"
      }
    ]
  }
};

// ==============================
// FUNÇÕES AUXILIARES
// ==============================

/**
 * Lê um parâmetro da querystring (?plan=essencial_plan)
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Atalhos de DOM
 */
function $(selector) {
  return document.querySelector(selector);
}

// ==============================
// INICIALIZAÇÃO GERAL
// ==============================

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await ensureUserLogged();
  const selectedPlanId = getQueryParam("plan") || "essencial_plan";
  const selectedPlan = PLANS[selectedPlanId] || PLANS["essencial_plan"];

  // Preenche textos da página
  fillUserName(currentUser);
  fillPlanSummary(selectedPlan);

  // Configura checkbox de termos e botão
  setupTermsAndButton();

  // Inicializa Mercado Pago
  initMercadoPagoCheckout(selectedPlan);
});

// ==============================
// GARANTIR USUÁRIO LOGADO
// ==============================

async function ensureUserLogged() {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        // Se quiser, redirecione para login
        alert("Você precisa estar logado para assinar um plano.");
        window.location.href = "index.html";
        return reject("Usuário não logado");
      }
      resolve(user);
    });
  });
}

// ==============================
// PREENCHER DADOS NA TELA
// ==============================

async function fillUserName(user) {
  const span = document.querySelector("#checkout-user-name");
  if (!span || !user) return;

  try {
    const doc = await firebase.firestore()
      .collection("users")
      .doc(user.uid)
      .get();

    const data = doc.data();

    if (data && data.fullName) {
      // Exibe o nome COMPLETO exatamente como está no Firestore
      span.textContent = data.fullName;
    } else {
      // Fallback caso não exista no Firestore
      span.textContent = user.displayName || user.email.split("@")[0];
    }

  } catch (e) {
    console.error("Erro ao buscar nome completo:", e);
    span.textContent = user.displayName || user.email.split("@")[0];
  }
}


function fillPlanSummary(plan) {
  // Título e preço
  $("#planName").textContent = plan.name;
  $("#planPrice").textContent = plan.priceLabel;
  $("#totalValue").textContent = plan.priceLabel;

  // Ícone
  const iconEl = document.querySelector(".summary-icon i");
  if (iconEl) iconEl.className = plan.icon;

  // Benefícios
  const benefitsContainer = document.querySelector(".benefits-block");
  const benefitsTitle = document.querySelector(".benefits-title");

  // limpa itens antigos
  benefitsContainer.innerHTML = `
    <h4 class="benefits-title">Benefícios do plano:</h4>
  `;

  // recria cada benefício dinamicamente
  plan.benefits.forEach(b => {
    const item = document.createElement("div");
    item.classList.add("benefit-item");

    item.innerHTML = `
      <div class="benefit-icon">
        <i class="${b.icon}"></i>
      </div>
      <div>
        <strong class="benefit-title">${b.title}</strong>
        <p class="benefit-subtitle">${b.subtitle}</p>
      </div>
    `;

    benefitsContainer.appendChild(item);
  });
}



// ==============================
// TERMOS & BOTÃO
// ==============================

function setupTermsAndButton() {
  const checkbox = $("#termsCheckbox");
  const payButton = $("#payButton");

  if (!checkbox || !payButton) return;

  // começa desabilitado
  payButton.classList.add("disabled");
  payButton.disabled = true;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      payButton.disabled = false;
      payButton.classList.remove("disabled");
    } else {
      payButton.disabled = true;
      payButton.classList.add("disabled");
    }
  });
}

// ==============================
// MERCADO PAGO – CARD FORM
// ==============================

function initMercadoPagoCheckout(plan) {
  if (!window.MercadoPago) {
    console.error("MercadoPago.js não foi carregado.");
    return;
  }

  const mp = new MercadoPago(MP_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  const payButton = $("#payButton");
  const form = $("#payment-form");

  if (!form || !payButton) return;

  // Configura o CardForm do Mercado Pago
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
      cardExpirationDate: {
        id: "cardExpiration",
        placeholder: "MM/AA",
      },
      securityCode: {
        id: "cardCVC",
        placeholder: "CVC",
      },
      // campos extras (não estamos usando agora, mas o SDK espera alguns)
      // removidos porque não são usados no checkout transparente
installments: {
  id: null,
},
identificationType: {
  id: null,
},
identificationNumber: {
  id: null,
},
cardholderEmail: {
  id: null,
},

    },
    callbacks: {
      onSubmit: async (event) => {
        event.preventDefault();

        const terms = $("#termsCheckbox");
        if (!terms.checked) {
          alert("Você precisa aceitar os Termos e Condições.");
          return;
        }

        try {
          payButton.disabled = true;
          payButton.textContent = "Processando...";

          const {
            token,
            paymentMethodId,
          } = cardForm.getCardFormData();

          const firebaseUser = firebase.auth().currentUser;
          const idToken = await firebaseUser.getIdToken();

          // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
          // AQUI é onde vamos chamar o backend no PASSO 4
          // Enviar token do cartão + plano selecionado
          // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

          const res = await fetch(`${API_BASE_URL}/api/subscriptions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              plan_id: plan.id,
              card_token: token,
              payment_method_id: paymentMethodId,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error("Erro na API:", data);
            alert(
              data.detail ||
                "Não foi possível processar o pagamento. Tente novamente."
            );
            payButton.disabled = false;
            payButton.textContent = "Monitorar Diário Oficial →";
            return;
          }

          // Sucesso! Aqui você pode redirecionar para página de obrigado
          alert("Assinatura criada com sucesso! 🎉");
          window.location.href = "monitoramento.html";
        } catch (error) {
          console.error(error);
          alert("Erro inesperado ao processar o pagamento.");
          payButton.disabled = false;
          payButton.textContent = "Monitorar Diário Oficial →";
        }
      },
    },
  });
}
