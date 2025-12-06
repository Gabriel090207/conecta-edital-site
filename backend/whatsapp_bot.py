from fastapi import APIRouter, Request
import httpx
from datetime import datetime
import pytz

router = APIRouter()

ZAPI_INSTANCE = "3EB273C95E6311A457864AD69F0E752E"
ZAPI_TOKEN = "2031713C62727E8CBD2DB511"

# endpoint correto (sem headers extras)
ZAPI_URL = f"https://api.z-api.io/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/send-text"

# controle de flood 45s
RATE_LIMIT_DELAY = 45
ultima_interacao = {}


async def send_whatsapp(numero, texto):
    # remove caracteres especiais e garante prefixo 55
    numero = ''.join(filter(str.isdigit, numero))
    if not numero.startswith("55"):
        numero = "55" + numero

    payload = {
        "phone": numero,
        "message": texto
    }

    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(ZAPI_URL, json=payload)  # sem headers extras
            print("📤 ENVIO Z-API RESPOSTA:", r.text)
        except Exception as e:
            print("❌ Erro no envio:", e)

    print(f"📤 Enviado para {numero}: {texto}")


def saudacao():
    hora = datetime.now(pytz.timezone("America/Sao_Paulo")).hour
    if hora < 12:
        return "🌅 *Bom dia*"
    elif hora < 18:
        return "🌤️ *Boa tarde*"
    return "🌙 *Boa noite*"


@router.post("/api/webhook-whatsapp")
async def webhook_whatsapp(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    # ignora mensagens enviadas pelo próprio bot
    if data.get("fromMe"):
        return {"status": "ignored"}

    numero = data.get("phone")
    texto = data.get("text", {}).get("message", "")
    texto = texto.lower().strip() if texto else ""

    if not texto:
        print("⚠️ Mensagem recebida sem texto (áudio/imagem/documento)")
        return {"status": "no_text"}

    # rate limit anti-flood
    agora = datetime.timestamp(datetime.now())
    ultimo = ultima_interacao.get(numero, 0)

    if agora - ultimo < RATE_LIMIT_DELAY:
        return {"status": "limit"}

    ultima_interacao[numero] = agora

    # disparo inicial / menu
    if texto in ["oi", "opa", "olá", "ola", "bom dia", "boa tarde", "boa noite", "eai", "e aí", "oie", "oi!", "menu", "começar", "inicio", "start"]:
        mensagem = (
            f"{saudacao()} 👋\n\n"
            f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n"
            f"Como posso te ajudar hoje?\n\n"
            f"1️⃣ Monitoramento\n"
            f"2️⃣ Planos\n"
            f"3️⃣ Dicas\n"
            f"4️⃣ Suporte\n"
            f"5️⃣ Outros\n\n"
            f"Digite o número da opção.\n"
            f"Se quiser voltar, envie *menu*."
        )
        await send_whatsapp(numero, mensagem)
        return {"status": "ok"}

    # opções do menu
    if texto == "1":
        await send_whatsapp(numero, "🔍 *Monitoramento*: Me diga qual edital ou nome deseja acompanhar.")
        return {"status": "ok"}

    if texto == "2":
        await send_whatsapp(numero, "💳 *Planos*: Temos Essencial (3 slots) e Premium (ilimitado). Quer detalhes?")
        return {"status": "ok"}

    if texto == "3":
        await send_whatsapp(numero, "💡 *Dicas*: Quer sugestões sobre estudos, concursos ou organização?")
        return {"status": "ok"}

    if texto == "4":
        await send_whatsapp(numero, "🎧 *Suporte*: descreva seu problema e vou ajudar.")
        return {"status": "ok"}

    if texto == "5":
        await send_whatsapp(numero, "✍️ Pode me contar, qual assunto deseja tratar?")
        return {"status": "ok"}

    # fallback
    await send_whatsapp(numero, "🤖 Não entendi. Digite *menu* para ver as opções.")
    return {"status": "ok"}
