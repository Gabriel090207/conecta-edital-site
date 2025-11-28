from fastapi import APIRouter, Request, HTTPException
from firebase_admin import firestore
import mercadopago
import os

router = APIRouter()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
mp = mercadopago.SDK(MP_ACCESS_TOKEN)

# =====================================================
#  🔔 WEBHOOK MERCADO PAGO — ASSINATURAS RECORRENTES
# =====================================================
@router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    try:
        data = await request.json()
        print("\n📩 WEBHOOK RECEBIDO:", data)

        action = data.get("action")
        if not action:
            return {"status": "ignored"}

        # Identifica o ID da assinatura (preapproval_id)
        preapproval_id = None

        if action in ["created", "updated", "paused", "cancelled"]:
            preapproval_id = data["data"]["id"]

        if not preapproval_id:
            print("⚠️ Webhook sem preapproval_id")
            return {"status": "ignored"}

        # ============================================
        # 🔍 Buscar detalhes da assinatura no Mercado Pago
        # ============================================
        sub_info = mp.preapproval().get(preapproval_id)
        sub_data = sub_info.get("response", {})

        status_ = sub_data.get("status")
        external_reference = sub_data.get("external_reference")  # nosso UID do usuário
        plan_reason = sub_data.get("reason")

        if not external_reference:
            print("⚠️ Sem external_reference")
            return {"status": "ignored"}

        user_uid = external_reference

        db = firestore.client()
        user_ref = db.collection("users").document(user_uid)

        print(f"🔎 Assinatura do usuário {user_uid} nova situação: {status_}")

        # ============================================
        #  🟢 STATUS: APROVADO / ATIVO
        # ============================================
        if status_ == "authorized" or status_ == "active":
            user_ref.update({
                "subscription_status": "active",
                "subscription_plan": plan_reason,
                "subscription_id": preapproval_id
            })
            print("✔ Assinatura marcada como ativa.")

        # ============================================
        #  🔁 RENOVAÇÃO MENSAL OK
        # ============================================
        if status_ == "authorized":
            print("🔔 Renovação mensal bem-sucedida!")

        # ============================================
        #  ❌ CARTÃO RECUSADO / COBRANÇA FALHOU
        # ============================================
        if status_ == "pending" or status_ == "paused":
            user_ref.update({"subscription_status": "pending"})
            print("⚠️ Cobrança pendente (aguardando pagamento).")

        if status_ == "expired":
            user_ref.update({"subscription_status": "expired"})
            print("⚠️ Assinatura expirada.")

        # ============================================
        #  🛑 CANCELADA PELO CLIENTE
        # ============================================
        if status_ == "cancelled":
            user_ref.update({"subscription_status": "cancelled"})
            print("🛑 Assinatura cancelada.")

        return {"status": "ok"}

    except Exception as e:
        print("❌ ERRO NO WEBHOOK:", e)
        raise HTTPException(status_code=500, detail=str(e))
