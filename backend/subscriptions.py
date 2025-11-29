from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
import mercadopago
import os

router = APIRouter()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
mp = mercadopago.SDK(MP_ACCESS_TOKEN)

# ------------------------------
# MODELO RECEBIDO DO FRONT
# ------------------------------
class SubscriptionRequest(BaseModel):
    plan_id: str
    card_token: str
    payment_method_id: str
    issuer_id: str | None = None


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

        print("\n\n=== [DEBUG] Dados recebidos do frontend ===")
        print("Plano:", req.plan_id)
        print("Card Token:", req.card_token)
        print("Método:", req.payment_method_id)
        print("Issuer:", req.issuer_id)

        # --------------------------
        # DEFINIR O PLANO
        # --------------------------
        if req.plan_id == "essencial_plan":
            amount = 15.9
            reason = "Plano Essencial"
        elif req.plan_id == "premium_plan":
            amount = 35.9
            reason = "Plano Premium"
        else:
            raise HTTPException(status_code=400, detail="Plano inválido")

        # --------------------------
        # PAYLOAD (ASSINATURA REAL)
        # --------------------------
        preapproval_payload = {
            "payer_email": user_email,
            "card_token_id": req.card_token,
            "issuer_id": req.issuer_id,
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": amount,
                "currency_id": "BRL"
            },
            "reason": reason,
            "external_reference": user_uid,

            # 🔥 URLs DE RETORNO DO NETLIFY
            "back_url": "https://siteconectaedital.netlify.app/sucesso.html",
            "back_urls": {
                "success": "https://siteconectaedital.netlify.app/sucesso.html",
                "pending": "https://siteconectaedital.netlify.app/pendente.html",
                "failure": "https://siteconectaedital.netlify.app/erro.html"
            }
        }

        print("\n=== [DEBUG] Preapproval enviado ao MP ===")
        print(preapproval_payload)

        # --------------------------
        # CRIA A ASSINATURA
        # --------------------------
        preapproval_response = mp.preapproval().create(preapproval_payload)

        print("\n=== [DEBUG] Resposta do MP ===")
        print(preapproval_response)

        # --------------------------
        # ERRO NO MERCADO PAGO
        # --------------------------
        if "id" not in preapproval_response.get("response", {}):
            raise Exception(preapproval_response.get("response"))

        subscription_id = preapproval_response["response"]["id"]

        # --------------------------
        # SALVAR NO FIRESTORE
        # --------------------------
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
        print("❌ ERRO FINAL:", e)
        raise HTTPException(status_code=500, detail=str(e))
