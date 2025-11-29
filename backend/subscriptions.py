from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
import mercadopago

router = APIRouter()

# Você já tem isso no .env e no main, então importe daqui também:
import os
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

mp = mercadopago.SDK(MP_ACCESS_TOKEN)

def get_or_create_customer_by_email(email: str) -> str:
    """
    Tenta encontrar um cliente pelo e-mail.
    Se não existir, cria um novo e retorna o ID.
    """
    try:
        # Busca clientes pelo e-mail
        search_response = mp.customer().search(filters={"email": email})
        results = search_response.get("response", {}).get("results", [])

        if results:
            # Já existe cliente com esse e-mail
            return results[0]["id"]

        # Se não achou, cria um novo
        customer_response = mp.customer().create({"email": email})
        return customer_response["response"]["id"]

    except Exception as e:
        print("Erro ao buscar/criar customer:", e)
        # Última tentativa: cria um novo cliente
        customer_response = mp.customer().create({"email": email})
        return customer_response["response"]["id"]



# Modelo de dados enviado pelo frontend
class SubscriptionRequest(BaseModel):
    plan_id: str
    card_token: str
    payment_method_id: str


# Função temporária para simular autenticação Firebase (vamos trocar isso depois)

from utils.auth_utils import verify_firebase_token

@router.post("/api/subscriptions")
async def create_subscription(
    req: SubscriptionRequest,
    firebase_user=Depends(verify_firebase_token)
):

    try:
        user_uid = firebase_user["uid"]
        user_email = firebase_user["email"]

        db = firestore.client()

        # Criar cliente
                # Buscar ou criar cliente pelo e-mail
        customer_id = get_or_create_customer_by_email(user_email)

        print("\n\n=== [DEBUG] Dados recebidos do frontend ===")
        print("Plano:", req.plan_id)
        print("Card Token:", req.card_token)
        print("Método de Pagamento:", req.payment_method_id)


        # Salvar cartão
        card_response = mp.card().create(customer_id, {"token": req.card_token})
        card_id = card_response["response"]["id"]

        # Definir plano
        if req.plan_id == "essencial_plan":
            amount = 15.9
            reason = "Plano Essencial"
        elif req.plan_id == "premium_plan":
            amount = 35.9
            reason = "Plano Premium"
        else:
            raise HTTPException(status_code=400, detail="Plano inválido")

        # Criar assinatura recorrente
        preapproval = {
            "payer_email": user_email,
            "card_id": card_id,
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": amount,
                "currency_id": "BRL"
            },
            "reason": reason,
            "external_reference": user_uid
        }

        print("\n=== [DEBUG] Preapproval enviado ===")
        print(preapproval)

        preapproval_response = mp.preapproval().create(preapproval)
        subscription_id = preapproval_response["response"]["id"]

        print("\n=== [DEBUG] Resposta do Mercado Pago (preapproval) ===")
        print(preapproval_response)


        # Salvar no Firestore
        db.collection("users").document(user_uid).set({
            "subscription_status": "active",
            "subscription_plan": req.plan_id,
            "subscription_id": subscription_id
        }, merge=True)

        return {
            "message": "Assinatura criada com sucesso!",
            "subscription_id": subscription_id
        }

    except Exception as e:
        print("Erro:", e)
        raise HTTPException(status_code=500, detail=str(e))
