import os
import httpx
from fastapi import APIRouter, Request

router = APIRouter()

ZAPI_INSTANCE_ID = os.getenv("ZAPI_INSTANCE_ID")
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")

async def send_whatsapp(to_number: str, message: dict):
    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-messages"
    
    payload = {
        "phone": to_number,
        "messages": [message]
    }

    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload)


@router.post("/api/webhook-whatsapp")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    try:
        message = data.get("message", {})
        text = message.get("text", "").strip()
        sender = message.get("sender", "")

        # Ignora envios do próprio bot
        if message.get("fromMe"):
            return {"status": "ignored"}

        # Primeira mensagem → Enviar botões iniciais
        if text.lower() in ["oi", "olá", "bom dia", "boa tarde", "boa noite", "menu", "start"]:
            reply = {
                "type": "button",
                "buttons": [
                    {"id": "b_dicas", "text": "📌 Dicas"},
                    {"id": "b_suporte", "text": "🛠 Suporte"},
                    {"id": "b_monitoramento", "text": "📊 Monitoramento"},
                    {"id": "b_planos", "text": "💳 Planos"},
                    {"id": "b_outro", "text": "💬 Outro"}
                ],
                "text": "Olá! 👋\n\nSou o *Conectinha*, seu assistente.\n\nSobre qual assunto você deseja falar hoje?"
            }

            await send_whatsapp(sender, reply)
            return {"status": "ok"}

        return {"status": "no-action"}

    except Exception as e:
        print("❌ ERRO BOT:", e)
        return {"error": str(e)}
