from fastapi import APIRouter, Request
import httpx
from datetime import datetime
import pytz
import os

router = APIRouter()

# ==========================
# CONFIG Z-API
# ==========================
ZAPI_INSTANCE = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")

SEND_TEXT_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
SEND_BUTTON_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-button-message"

# ==========================
# ANTI FLOOD
# ==========================
RATE_LIMIT_DELAY = 45
ultima_interacao = {}

# ==========================
# ENVIO TEXTO
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
# ENVIO BOTÕES
# ==========================
async def send_buttons(numero, saudacao_texto):
    numero = ''.join(filter(str.isdigit, numero))
    if not numero.startswith("55"):
        numero = "55" + numero

    payload = {
        "phone": numero,
        "message": {
            "text": saudacao_texto,
            "buttons": [
                {"id": "1", "text": "📊 Monitoramento"},
                {"id": "2", "text": "💳 Planos"},
                {"id": "3", "text": "💡 Dicas"},
                {"id": "4", "text": "🎧 Suporte"},
                {"id": "5", "text": "✍️ Outros"}
            ]
        }
    }

    headers = {
        "client-token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(SEND_BUTTON_URL, json=payload, headers=headers)
        print("📤 RESPOSTA BOTÕES Z-API:", r.text)

    print(f"📤 Botões enviados para {numero}")

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

    # texto normal
    texto = data.get("text", {}).get("message", "")
    texto = texto.lower().strip() if texto else ""

    # resposta de botão
    button = data.get("buttonResponse", {}).get("id")
    if button:
        texto = button  # força "1","2","3","4","5"

    if not texto:
        return {"status": "no_text"}

    # anti flood
    agora = datetime.timestamp(datetime.now())
    ultimo = ultima_interacao.get(numero, 0)

    if agora - ultimo < RATE_LIMIT_DELAY:
        return {"status": "limit"}

    ultima_interacao[numero] = agora

    # ==========================
    # MENU
    # ==========================
    if texto in ["oi", "opa", "olá", "ola", "bom dia", "boa tarde", "boa noite", "eai", "e aí", "oie", "oi!", "menu", "começar", "inicio", "start"]:
        menu_texto = (
            f"{saudacao()} 👋\n\n"
            f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n\n"
            f"Escolha uma opção:"
        )
        await send_buttons(numero, menu_texto)
        return {"status": "ok"}

    # ==========================
    # RESPOSTAS DO MENU
    # ==========================
    if texto == "1":
        await send_whatsapp(numero, "🔍 Informe qual edital deseja monitorar.")
        return {"status": "ok"}

    if texto == "2":
        await send_whatsapp(numero, "💳 Planos disponíveis: Essencial e Premium.")
        return {"status": "ok"}

    if texto == "3":
        await send_whatsapp(numero, "💡 Dicas: posso sugerir métodos de estudo e alertas.")
        return {"status": "ok"}

    if texto == "4":
        await send_whatsapp(numero, "🎧 Suporte: Nos conte seu problema.")
        return {"status": "ok"}

    if texto == "5":
        await send_whatsapp(numero, "✍️ Pode me contar, qual assunto deseja tratar?")
        return {"status": "ok"}

    # fallback
    await send_whatsapp(numero, "🤖 Não entendi. Envie 'menu' para opções.")
    return {"status": "ok"}
