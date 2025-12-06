from fastapi import APIRouter, Request
import httpx
from datetime import datetime
import pytz
import os
import asyncio
from memoria import salvar_mensagem, obter_historico, limpar_conversa
from openai import OpenAI

# Inicializa o cliente OpenAI com sua chave de API
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Z-API configurações
ZAPI_INSTANCE = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN")
SEND_TEXT_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"
SEND_TYPING_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/typing"

# Controle de flood (45s entre interações)
RATE_LIMIT_DELAY = 45
ultima_interacao = {}

router = APIRouter()

# Controle de quem está sendo atendido
atendimento_humano = {}

# Enviar mensagem "digitando..."
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

# Enviar mensagem
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

# Função para retornar saudação com base no horário
def saudacao():
    hora = datetime.now(pytz.timezone("America/Sao_Paulo")).hour
    if hora < 12:
        return "🌅 *Bom dia*"
    elif hora < 18:
        return "🌤️ *Boa tarde*"
    return "🌙 *Boa noite*"

# Roteamento de webhook
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

    # Anti-flood
    agora = datetime.timestamp(datetime.now())
    ultimo = ultima_interacao.get(numero, 0)

    if agora - ultimo < RATE_LIMIT_DELAY:
        return {"status": "limit"}

    ultima_interacao[numero] = agora

    # ============================
    # SE USUÁRIO ESTÁ EM MODO HUMANO
    # ============================
    modo = atendimento_humano.get(numero)

    if modo:
        if texto == "menu":
            atendimento_humano[numero] = None
            limpar_conversa(numero)
            await send_whatsapp(numero, "🔄 Você voltou ao atendimento automático. Digite *oi* para recomeçar.")
            return {"status": "ok"}

        # Redireciona para o atendente correspondente
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

        return {"status": "ok"}

    # ============================
    # MENU PRINCIPAL
    # ============================
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

    # ============================
    # OPÇÕES QUE ATIVAM ATENDIMENTO HUMANO
    # ============================
    if texto == "1":
        atendimento_humano[numero] = "monitoramento"
        await send_whatsapp(numero, "👨‍💼 Um atendente chamado *Carlos* será enviado para responder suas dúvidas sobre monitoramento.")
        
        # Chama a função responder para o atendimento de Carlos
        from atendente_monitoramento import responder
        return await responder(numero, texto)

    if texto == "2":
        atendimento_humano[numero] = "planos"
        await send_whatsapp(numero, "👨‍💼 Um atendente será enviado para explicar os planos disponíveis.")
        return {"status": "ok"}

    if texto == "3":
        atendimento_humano[numero] = "dicas"
        await send_whatsapp(numero, "👨‍💼 Um atendente será enviado para fornecer dicas personalizadas.")
        return {"status": "ok"}

    if texto == "4":
        atendimento_humano[numero] = "suporte"
        await send_whatsapp(numero, "👨‍💼 Um atendente técnico será enviado para ajudar com seu suporte.")
        return {"status": "ok"}

    if texto == "5":
        atendimento_humano[numero] = "outros"
        await send_whatsapp(numero, "👨‍💼 Um atendente será enviado para discutir outros assuntos.")
        return {"status": "ok"}

    # ============================
    # Fallback
    # ============================
    await send_typing(numero)
    await asyncio.sleep(1.5)
    await send_whatsapp(numero, "🤖 Não entendi. Digite *menu* para ver as opções.")
    return {"status": "ok"}
