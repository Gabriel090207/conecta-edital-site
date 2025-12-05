# whatsapp_bot.py
from fastapi import APIRouter, Request
import httpx
import asyncio
from datetime import datetime
import pytz

router = APIRouter()

ZAPI_INSTANCE_ID = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"

# -------------------- ENVIO WHATSAPP --------------------

async def send_whatsapp(phone: str, message: str):
    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-text"

    payload = {
        "phone": phone,
        "message": message
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload)
        print("📤 RESPOSTA Z-API:", response.text)
        return response.text

# -------------------- MENU PRINCIPAL --------------------

def get_initial_menu():
    br_time = datetime.now(pytz.timezone("America/Sao_Paulo"))
    hour = br_time.hour

    if hour < 12:
        greet = "🌅 *Bom dia*"
    elif 12 <= hour < 18:
        greet = "🌤️ *Boa tarde*"
    else:
        greet = "🌙 *Boa noite*"

    return (
        f"{greet} 👋\n"
        f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n\n"
        f"Como posso te ajudar hoje?\n\n"
        f"1️⃣ Monitoramento\n"
        f"2️⃣ Planos\n"
        f"3️⃣ Dicas\n"
        f"4️⃣ Suporte\n"
        f"5️⃣ Outros\n\n"
        f"Digite a opção desejada.\n"
        f"Se quiser voltar ao menu, digite: *menu*"
    )

# -------------------- RESPOSTAS DE CADA OPÇÃO --------------------

async def process_option(phone, text):
    txt = text.strip().lower()

    if txt == "menu":
        await send_whatsapp(phone, get_initial_menu())
        return

    if txt in ["1", "monitoramento"]:
        await send_whatsapp(phone, "🔍 *Monitoramento*\n\nDigite qual dúvida você tem sobre monitoramentos.")
        return

    if txt in ["2", "planos"]:
        await send_whatsapp(
            phone,
            "💳 *Planos*\n\nTemos:\n\n"
            "• *Essencial* – 3 monitoramentos + email\n"
            "• *Premium* – ilimitados + email + whatsapp\n\n"
            "Qual deseja saber mais?"
        )
        return

    if txt in ["3", "dicas"]:
        await send_whatsapp(
            phone,
            "💡 *Dicas de estudo enviadas com sucesso!*\n\n"
            "Estamos preparando conteúdo incrível para você! 📚"
        )
        return

    if txt in ["4", "suporte"]:
        await send_whatsapp(
            phone,
            "🆘 *Suporte*\n\nMe diga com detalhes qual é o problema e já verifico para você! 🔎"
        )
        return

    if txt in ["5", "outros"]:
        await send_whatsapp(
            phone,
            "📩 *Outros assuntos*\n\nEscreva abaixo no que posso te ajudar!"
        )
        return

    # Se digitou outra coisa fora das opções, responde normalmente
    await send_whatsapp(phone, f"Entendi! 😊\n\nMas antes, preciso que escolha uma opção do menu.\n\n{get_initial_menu()}")

# -------------------- WEBHOOK WHATSAPP --------------------

@router.post("/webhook-whatsapp")
async def webhook(response: Request):
    data = await response.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    if data.get("type") != "ReceivedCallback":
        return {"status": "ignored"}

    phone = data.get("phone")
    message = data.get("text", {}).get("message", "").strip()

    # IGNORAR MENSAGENS ENVIADAS POR NÓS
    if data.get("fromMe"):
        return {"status": "ignored_from_me"}

    # Se enviou qualquer coisa → responde com menu
    if message:
        await asyncio.sleep(1)  # pequeno delay só para naturalidade
        await send_whatsapp(phone, get_initial_menu())
        return {"status": "ok"}

    return {"status": "no_text"}
