from fastapi import APIRouter, Request
import httpx
from datetime import datetime
import pytz
import os
import asyncio
from memoria import salvar_mensagem, obter_historico, limpar_conversa

# OpenAI client
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Z-API configurações
ZAPI_INSTANCE = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")
SEND_TEXT_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
SEND_TYPING_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/typing"

# Anti-flood (45s entre interações)
RATE_LIMIT_DELAY = 45
ultima_interacao = {}

router = APIRouter()

# Controle de sessão: qual atendente está ativo por número
atendimento_humano = {}

# -----------------------------
# FUNÇÕES DE ENVIO
# -----------------------------

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


async def send_whatsapp(numero, texto):
    numero = ''.join(filter(str.isdigit, numero))
    if not numero.startswith("55"):
        numero = "55" + numero

    payload = {"phone": numero, "message": texto}

    headers = {
        "client-token": ZAPI_CLIENT_TOKEN,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(SEND_TEXT_URL, json=payload, headers=headers)
        print("📤 RESPOSTA Z-API:", r.text)

    print(f"📤 Enviado para {numero}: {texto}")


# -----------------------------
# SAUDAÇÃO DINÂMICA
# -----------------------------

def saudacao():
    hora = datetime.now(pytz.timezone("America/Sao_Paulo")).hour
    if hora < 12:
        return "🌅 *Bom dia*"
    elif hora < 18:
        return "🌤️ *Boa tarde*"
    return "🌙 *Boa noite*"


# -----------------------------
# WEBHOOK PRINCIPAL
# -----------------------------

@router.post("/api/webhook-whatsapp")
async def webhook_whatsapp(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    if data.get("fromMe"):
        return {"status": "ignored"}

    numero = data.get("phone")

    # -----------------------------
    # CAPTURA DE TEXTO (SUPORTA FORMATOS NOVOS E ANTIGOS)
    # -----------------------------
    raw_text = data.get("text")

    if isinstance(raw_text, dict):  # Formato antigo {"text": {"message": "..."}}
        texto = raw_text.get("message", "")
    else:
        texto = raw_text

    # Fallbacks adicionais
    if not texto:
        texto = data.get("body") or data.get("message") or data.get("caption")

    texto = texto.lower().strip() if texto else ""

    if not texto:
        return {"status": "no_text"}

    # -----------------------------
    # ANTI-FLOOD
    # -----------------------------
    agora = datetime.timestamp(datetime.now())
    ultimo = ultima_interacao.get(numero, 0)

    if agora - ultimo < RATE_LIMIT_DELAY:
        return {"status": "rate_limited"}

    ultima_interacao[numero] = agora

    # -----------------------------
    # SE JÁ ESTÁ EM ATENDIMENTO
    # -----------------------------
    modo = atendimento_humano.get(numero)

    if modo:
        if texto == "menu":
            atendimento_humano[numero] = None
            limpar_conversa(numero)
            await send_whatsapp(numero, "🔄 Você voltou ao atendimento automático. Digite *oi* para recomeçar.")
            return {"status": "ok"}

        # Encaminhamento para o respectivo atendente
        if modo == "monitoramento":
            from atendente_monitoramento import responder
            return await responder(numero, texto)

        if modo == "planos":
            from atendente_planos import responder
            return await responder(numero, texto)

        if modo == "dicas":
            from atendente_dicas import responder
            return await responder(numero, texto)

        if modo == "suporte":
            from atendente_suporte import responder
            return await responder(numero, texto)

        if modo == "outros":
            from atendente_outros import responder
            return await responder(numero, texto)

        return {"status": "unknown_mode"}

    # -----------------------------
    # MENU PRINCIPAL
    # -----------------------------
    if texto in ["oi", "opa", "olá", "ola", "bom dia", "boa tarde", "boa noite", "menu", "eai", "e aí", "oie", "começar", "inicio", "start"]:
        await send_typing(numero)
        await asyncio.sleep(1)

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
        return {"status": "menu_sent"}

    # -----------------------------
    # ATIVAÇÃO POR NÚMEROS
    # -----------------------------
    if texto in ["1", "1️⃣"]:
        atendimento_humano[numero] = "monitoramento"
        await send_whatsapp(numero, "👨‍💼 Conectando você ao setor *Monitoramento*...")
        from atendente_monitoramento import responder
        return await responder(numero, texto)

    if texto in ["2", "2️⃣"]:
        atendimento_humano[numero] = "planos"
        await send_whatsapp(numero, "📄 Estamos conectando você ao setor de *Planos*...")
        return {"status": "ok"}

    if texto in ["3", "3️⃣"]:
        atendimento_humano[numero] = "dicas"
        await send_whatsapp(numero, "💡 Um atendente irá te enviar dicas úteis em instantes!")
        return {"status": "ok"}

    if texto in ["4", "4️⃣"]:
        atendimento_humano[numero] = "suporte"
        await send_whatsapp(numero, "🛠️ Redirecionando você para o suporte técnico...")
        return {"status": "ok"}

    if texto in ["5", "5️⃣"]:
        atendimento_humano[numero] = "outros"
        await send_whatsapp(numero, "📌 Direcionando você para atendimento geral...")
        return {"status": "ok"}

    # -----------------------------
    # RESPOSTA PADRÃO
    # -----------------------------
    await send_typing(numero)
    await asyncio.sleep(1)
    await send_whatsapp(numero, "🤖 Não entendi. Digite *menu* para ver as opções.")
    return {"status": "fallback"}
