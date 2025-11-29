from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
import mercadopago
import os

router = APIRouter()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
mp = mercadopago.SDK(MP_ACCESS_TOKEN)


# =====================================================
# BUSCAR OU CRIAR CUSTOMER BY EMAIL
# =====================================================
def get_or_create_customer_by_email(email: str) -> str:
    try:
        search_response = mp.customer().search(filters={"email": email})
        results = search_response.get("response", {}).get("results", [])

        if results:
            return results[0]["id"]

        # Criar novo customer
        customer_response = mp.customer().create({"email": email})
        return customer_response["response"]["id"]

    except Exception:
        # fallback
        customer_response = mp.customer().create({"email": email})
        return customer_response["response"]["id"]


# =====================================================
# MODELO RECEBIDO DO FRONT
# =====================================================
class SubscriptionRequest(BaseModel):
    plan_id: str
    card_token: str
    payment_method_id: str
    issuer_id: str   # 🔥 AGORA INCLUÍDO


# =====================================================
# AUTENTICAÇÃO FIREBASE
# =====================================================
from utils.auth_utils import verify_firebase_token


# =====================================================
# CRIAR ASSINATURA RECORRENTE
# =====================================================
@router.post("/api/subscriptions")
async def create_subscription(
    req: SubscriptionRequest,
    firebase_user=Depends(verify_firebase_token)
):
    try:
        user_uid = firebase_user["uid"]
        user_email = firebase_user["email"]

        db = firestore.client()

        # Buscar ou criar cliente Mercado Pago
        customer_id = get_or_create_customer_by_email(user_email)

        print("\n\n=== [DEBUG] Dados recebidos do frontend ===")
        print("Plano:", req.plan_id)
        print("Card Token:", req.card_token)
        print("Método:", req.payment_method_id)
        print("Issuer:", req.issuer_id)

        # =====================================================
        # DEFINIR VALOR DO PLANO
        # =====================================================
        if req.plan_id == "essencial_plan":
            amount = 15.9
            reason = "Plano Essencial"
        elif req.plan_id == "premium_plan":
            amount = 35.9
            reason = "Plano Premium"
        else:
            raise HTTPException(status_code=400, detail="Plano inválido")

        # =====================================================
        # CRIAR PREAPPROVAL (ASSINATURA RECORRENTE)
        # =====================================================
        preapproval_payload = {
            "payer_email": user_email,
            "card_token_id": req.card_token,    # 🔥 TOKEN DO CARTÃO
            "issuer_id": req.issuer_id,         # 🔥 NECESSÁRIO PARA CARTÕES BR
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": amount,
                "currency_id": "BRL"
            },
            "reason": reason,
            "external_reference": user_uid
        }

        print("\n=== [DEBUG] Preapproval enviado ao MP ===")
        print(preapproval_payload)

        preapproval_response = mp.preapproval().create(preapproval_payload)

        print("\n=== [DEBUG] Resposta do MP ===")
        print(preapproval_response)

        # =====================================================
        # VALIDAR SE DEU CERTO
        # =====================================================
        if "response" not in preapproval_response or "id" not in preapproval_response["response"]:
            raise Exception(preapproval_response)

        subscription_id = preapproval_response["response"]["id"]

        # =====================================================
        # SALVAR NO FIRESTORE
        # =====================================================
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
        print("\n❌ ERRO FINAL:", e)
        raise HTTPException(status_code=500, detail=str(e))
