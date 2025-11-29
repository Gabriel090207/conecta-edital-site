from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
import mercadopago
import os

router = APIRouter()

# Mercado Pago SDK
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
mp = mercadopago.SDK(MP_ACCESS_TOKEN)

# Apenas o plano chega do frontend
class SubscriptionRequest(BaseModel):
    plan_id: str


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

        print("\n\n=== [DEBUG] Criando assinatura via LINK ===")
        print("Plano:", req.plan_id)
        print("UID:", user_uid)
        print("Email:", user_email)

        # --------------------------
        # DEFINIR O PLANO
        # --------------------------
        if req.plan_id == "essencial_plan":
            amount = 15.90
            reason = "Plano Essencial"
        elif req.plan_id == "premium_plan":
            amount = 35.90
            reason = "Plano Premium"
        else:
            raise HTTPException(status_code=400, detail="Plano inválido")

        # --------------------------
        # PAYLOAD DO PREAPPROVAL LINK
        # --------------------------
        payload = {
            "reason": reason,
            "external_reference": user_uid,
            "payer_email": user_email,

            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": amount,
                "currency_id": "BRL"
            },

            "back_url": "https://siteconectaedital.netlify.app/sucesso.html"
        }

        print("\n=== [DEBUG] Payload enviado ao Mercado Pago ===")
        print(payload)

        # --------------------------
        # CRIAR LINK DE ASSINATURA
        # --------------------------
        response = mp.preapproval().create(payload)

        print("\n=== [DEBUG] Resposta MP ===")
        print(response)

        if "init_point" not in response.get("response", {}):
            raise Exception(response.get("response"))

        approval_url = response["response"]["init_point"]
        subscription_id = response["response"]["id"]

        # SALVAR NO FIRESTORE
        db.collection("users").document(user_uid).set({
            "subscription_status": "pending_approval",
            "subscription_plan": req.plan_id,
            "subscription_id": subscription_id
        }, merge=True)

        return {
            "message": "Link gerado com sucesso",
            "checkout_url": approval_url
        }

    except Exception as e:
        print("❌ ERRO FINAL:", e)
        raise HTTPException(status_code=500, detail=str(e))
