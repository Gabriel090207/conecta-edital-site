# backend/payment_service.py

import mercadopago
import os
from dotenv import load_dotenv
from datetime import datetime
import asyncio
from typing import Optional, Dict

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Planos/Produtos disponíveis para compra
PLANS: Dict[str, Dict] = {
    "essencial_plan": {
        "title": "Plano Essencial",
        "description": "Até 3 monitoramentos simultâneos, verificação diária.",
        "price": 19.90,
        "currency_id": "BRL"
    },
    "premium_plan": {
        "title": "Plano Premium",
        "description": "Monitoramentos ilimitados, verificação em tempo real, todas as notificações.",
        "price": 39.90,
        "currency_id": "BRL"
    }
}

# IDs dos planos de assinatura criados no Mercado Pago
PREAPPROVAL_PLAN_IDS = {
    "essencial_plan": "acfb870d3be545b4b2b66fcd225274c1",
    "premium_plan": "b8754e354096452e99c46519f061d10c"
}

def create_mercadopago_checkout_url(
    plan_id: str, 
    preapproval_plan_ids: Dict[str, str]
) -> Optional[str]:
    """
    Cria uma URL de checkout para uma assinatura no Mercado Pago.
    """
    preapproval_plan_id = preapproval_plan_ids.get(plan_id)
    if not preapproval_plan_id:
        print(f"Erro: preapproval_plan_id para o plano '{plan_id}' não encontrado.")
        return None

    # URL fixa para o checkout de assinaturas
    base_url = "https://www.mercadopago.com.br/subscriptions/checkout"
    checkout_url = f"{base_url}?preapproval_plan_id={preapproval_plan_id}"
    
    print(f"URL de checkout de assinatura criada: {checkout_url}")
    return checkout_url

# A função de preferência antiga foi removida. O main.py chamará esta nova função.