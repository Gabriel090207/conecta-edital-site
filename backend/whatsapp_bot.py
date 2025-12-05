from fastapi import APIRouter, Request
import httpx
import os
import asyncio

router = APIRouter()

ZAPI_INSTANCE_ID = os.getenv("ZAPI_INSTANCE_ID")
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")

# Delay de segurança entre respostas
RATE_LIMIT_DELAY = 45

# Controle de última resposta
ultima_interacao = {}

async def send_whatsapp(to, text):
    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-messages"

    payload = {
        "phone": to,
        "message": text
    }

    headers = {
        "client-token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload, headers=headers)


def saudacao_horario():
    from datetime import datetime
    hora = datetime.now().hour
    if hora < 12:
        return "Bom dia ☀️"
    if hora < 18:
        return "Boa tarde 🌤️"
    return "Boa noite 🌙"


@router.post("/api/webhook-whatsapp")
async def webhook_whatsapp(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    if data.get("fromMe"):
        return {"status": "ignored"}

    numero = data.get("phone")
    texto = data.get("text", {}).get("message", "").strip().lower()

    # Rate limit 45s
    from datetime import datetime
    now = datetime.timestamp(datetime.now())
    last = ultima_interacao.get(numero, 0)

    if now - last < RATE_LIMIT_DELAY:
        return {"status": "rate_limit_blocked"}

    ultima_interacao[numero] = now

    # 📌 1 - Saudação inicial
    if texto in ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"]:
        mensagem = (
            f"{saudacao_horario()} 👋\n\n"
            f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n\n"
            f"Como posso te ajudar hoje?\n\n"
            f"Escolha uma opção abaixo:\n"
            f"1️⃣ Monitoramento\n"
            f"2️⃣ Planos\n"
            f"3️⃣ Dicas\n"
            f"4️⃣ Suporte\n"
            f"5️⃣ Outros"
        )
        await send_whatsapp(numero, mensagem)
        return {"status": "ok"}

    return {"status": "no_action"}
