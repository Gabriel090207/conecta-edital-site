from fastapi import APIRouter, Request, HTTPException
from firebase_admin import firestore
import mercadopago
import os

router = APIRouter()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
mp = mercadopago.SDK(MP_ACCESS_TOKEN)

@router.post("/webhook/preapproval")
async def mercadopago_preapproval_webhook(request: Request):
    try:
        data = await request.json()
        print("\n📬 [WEBHOOK RECEBIDO - PREAPPROVAL]")
        print(data)

        # Mercado Pago envia apenas { "id": "...", "type": "preapproval" }
        preapproval_id = data.get("id")
        if not preapproval_id:
            return {"status": "ignored"}

        # Buscar assinatura completa
        response = mp.preapproval().get(preapproval_id)
        info = response.get("response", {})

        print("\n🔍 [PREAPPROVAL INFO]")
        print(info)

        user_uid = info.get("external_reference")
        status_assinatura = info.get("status")     # active, paused, cancelled
        amount = info.get("auto_recurring", {}).get("transaction_amount", 0)
        reason = info.get("reason", "")

        if not user_uid:
            print("⚠️ Sem UID no external_reference")
            return {"status": "ignored"}

        # Determinar plano
        if amount == 15.9:
            plano = "essencial"
        elif amount == 35.9:
            plano = "premium"
        else:
            plano = "desconhecido"

        db = firestore.client()
        user_ref = db.collection("users").document(user_uid)

        # Atualiza de acordo com o status
        if status_assinatura in ["authorized", "active"]:
            user_ref.update({
                "subscription_status": "active",
                "subscription_plan": plano,
                "subscription_id": preapproval_id
            })
            print("✔ Assinatura ativada!")

        elif status_assinatura == "paused":
            user_ref.update({
                "subscription_status": "pending"
            })
            print("⏸ Assinatura pausada/pendente")

        elif status_assinatura == "cancelled":
            user_ref.update({
                "subscription_status": "cancelled",
                "subscription_plan": None
            })
            print("❌ Assinatura cancelada!")

        elif status_assinatura == "expired":
            user_ref.update({
                "subscription_status": "expired"
            })
            print("⚠️ Assinatura expirada!")

        return {"status": "ok"}

    except Exception as e:
        print("❌ ERRO NO WEBHOOK DE PREAPPROVAL:", e)
        raise HTTPException(status_code=500, detail=str(e))
