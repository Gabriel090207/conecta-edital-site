from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
import mercadopago

router = APIRouter()

# Você já tem isso no .env e no main, então importe daqui também:
import os
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

mp = mercadopago.SDK(MP_ACCESS_TOKEN)


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
        customer_response = mp.customer().create({"email": user_email})
        customer_id = customer_response["response"]["id"]

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

        preapproval_response = mp.preapproval().create(preapproval)
        subscription_id = preapproval_response["response"]["id"]

        # Salvar no Firestore
        db.collection("users").document(user_uid).update({
            "subscription_status": "active",
            "subscription_plan": req.plan_id,
            "subscription_id": subscription_id
        })

        return {
            "message": "Assinatura criada com sucesso!",
            "subscription_id": subscription_id
        }

    except Exception as e:
        print("Erro:", e)
        raise HTTPException(status_code=500, detail=str(e))
