from fastapi import APIRouter, Request
import httpx
from datetime import datetime
import pytz
import os
import asyncio

router = APIRouter()

# ==========================
# CONFIG Z-API
# ==========================
ZAPI_INSTANCE = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")

SEND_TEXT_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
SEND_TYPING_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/typing"

# ==========================
# ANTI FLOOD
# ==========================
RATE_LIMIT_DELAY = 45
ultima_interacao = {}

# ==========================
# ENVIAR "DIGITANDO…"
# ==========================
async def send_typing(numero):
    numero = ''.join(filter(str.isdigit, numero))
    if not numero.startswith("55"):
        numero = "55" + numero

    payload = {"phone": numero, "typing": True}

    headers = {
        "client-token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        await client.post(SEND_TYPING_URL, json=payload, headers=headers)

    print(f"⌛ digitando enviado para {numero}")

# ==========================
# ENVIAR TEXTO
# ==========================
async def send_whatsapp(numero, texto):
    numero = ''.join(filter(str.isdigit, numero))
    if not numero.startswith("55"):
        numero = "55" + numero

    payload = {
        "phone": numero,
        "message": texto
    }

    headers = {
        "client-token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(SEND_TEXT_URL, json=payload, headers=headers)
        print("📤 RESPOSTA Z-API:", r.text)

    print(f"📤 Enviado para {numero}: {texto}")

# ==========================
# SAUDAÇÃO
# ==========================
def saudacao():
    hora = datetime.now(pytz.timezone("America/Sao_Paulo")).hour
    if hora < 12:
        return "🌅 *Bom dia*"
    elif hora < 18:
        return "🌤️ *Boa tarde*"
    return "🌙 *Boa noite*"

# ==========================
# WEBHOOK
# ==========================
@router.post("/api/webhook-whatsapp")
async def webhook_whatsapp(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    if data.get("fromMe"):
        return {"status": "ignored"}

    numero = data.get("phone")
    texto = data.get("text", {}).get("message", "")
    texto = texto.lower().strip() if texto else ""

    if not texto:
        return {"status": "no_text"}

    # anti flood
    agora = datetime.timestamp(datetime.now())
    ultimo = ultima_interacao.get(numero, 0)
    if agora - ultimo < RATE_LIMIT_DELAY:
        return {"status": "limit"}
    ultima_interacao[numero] = agora

    # ==========================
    # MENU PRINCIPAL
    # ==========================
    if texto in ["oi", "opa", "olá", "ola", "bom dia", "boa tarde", "boa noite", "menu", "eai", "e aí", "oie", "começar", "inicio", "start"]:
        await send_typing(numero)
        await asyncio.sleep(2)

        mensagem = (
            f"{saudacao()} 👋\n\n"
            f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n\n"
            f"👇 *Selecione uma opção enviando o número:*\n\n"
            f"1️⃣ Monitoramento\n"
            f"2️⃣ Planos\n"
            f"3️⃣ Dicas\n"
            f"4️⃣ Suporte\n"
            f"5️⃣ Outros\n\n"
            f"📌 Para voltar ao menu, envie *menu*."
        )
        await send_whatsapp(numero, mensagem)
        return {"status": "ok"}

    # ==========================
    # OPÇÕES
    # ==========================
    if texto == "1":
        await send_typing(numero)
        await asyncio.sleep(1.5)
        await send_whatsapp(numero, "🔍 Me diga qual edital deseja monitorar.")
        return {"status": "ok"}

    if texto == "2":
        await send_typing(numero)
        await asyncio.sleep(1.5)
        await send_whatsapp(numero, "💳 Planos disponíveis: Essencial e Premium.")
        return {"status": "ok"}

    if texto == "3":
        await send_typing(numero)
        await asyncio.sleep(1.5)
        await send_whatsapp(numero, "💡 Posso te dar dicas sobre concursos, organização e preparação.")
        return {"status": "ok"}

    if texto == "4":
        await send_typing(numero)
        await asyncio.sleep(1.5)
        await send_whatsapp(numero, "🎧 Qual suporte você precisa agora?")
        return {"status": "ok"}

    if texto == "5":
        await send_typing(numero)
        await asyncio.sleep(1.5)
        await send_whatsapp(numero, "✍️ Pode me contar, qual assunto deseja tratar?")
        return {"status": "ok"}

    # ==========================
    # FALLBACK
    # ==========================
    await send_typing(numero)
    await asyncio.sleep(1.5)
    await send_whatsapp(numero, "🤖 Não entendi. Digite *menu* para ver as opções.")
    return {"status": "ok"}
