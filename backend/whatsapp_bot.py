from fastapi import APIRouter, Request
import httpx
import os
from datetime import datetime

router = APIRouter()

ZAPI_URL = f"https://api.z-api.io/instances/{os.getenv('ZAPI_INSTANCE_ID')}/token/{os.getenv('ZAPI_TOKEN')}"

# ==========================
# CONTEXTO POR USUÁRIO
# ==========================
user_context = {}
ultima_interacao = {}
RATE_LIMIT_DELAY = 45  # segundos

# ==========================
# FUNÇÃO ENVIO SEGURO
# ==========================
async def send_whatsapp_safe(numero, mensagem):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{ZAPI_URL}/send-text",
                json={"phone": numero, "message": mensagem}
            )
            print(f"📤 Enviado para {numero}: {mensagem}")
    except Exception as e:
        print("❌ ERRO ENVIO:", e)

# ==========================
# SAUDAÇÃO POR HORÁRIO
# ==========================
def saudacao_horario():
    hora = datetime.now().hour
    if 5 <= hora < 12:
        return "☀️ *Bom dia*"
    elif 12 <= hora < 18:
        return "🌤️ *Boa tarde*"
    else:
        return "🌙 *Boa noite*"

# ==========================
# MENU PRINCIPAL
# ==========================
async def send_menu(numero):
    msg = (
        f"{saudacao_horario()} 👋\n\n"
        f"Sou o *Conectinha*, seu assistente virtual 🤖✨\n"
        f"Como posso te ajudar hoje?\n\n"
        f"1️⃣ Monitoramento\n"
        f"2️⃣ Planos\n"
        f"3️⃣ Dicas\n"
        f"4️⃣ Suporte\n"
        f"5️⃣ Outros\n\n"
        f"Digite a opção desejada.\n"
        f"Se quiser voltar ao menu digite: *menu*"
    )
    await send_whatsapp_safe(numero, msg)

# ==========================
# PERSONAGENS
# ==========================
async def send_assistente_inicial(numero, tema):
    nomes = {
        "monitoramento": "Paulo",
        "planos": "Ana",
        "dicas": "Bianca",
        "suporte": "Carlos",
        "outros": "Conectinha"
    }

    msg = (
        f"{saudacao_horario()}! 👋\n"
        f"Me chamo *{nomes[tema]}* e vou te ajudar com *{tema}*.\n"
        f"Me conte sua dúvida 😊"
    )
    await send_whatsapp_safe(numero, msg)

# ==========================
# IA HUMANIZADA
# ==========================
import openai
openai.api_key = os.getenv("OPENAI_KEY")

async def gerar_resposta_ia(numero, texto, contexto):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": (
                f"Você interpreta o personagem responsável pelo tema {contexto}, "
                f"responda sempre de forma humana, empática e informal."
            )},
            {"role": "user", "content": texto}
        ]
    )

    return response["choices"][0]["message"]["content"]

# ==========================
# WEBHOOK PRINCIPAL
# ==========================
@router.post("/api/webhook-whatsapp")
async def webhook_whatsapp(request: Request):
    data = await request.json()
    print("📩 RECEBIDO WEBHOOK:", data)

    if data.get("fromMe"):
        return {"status": "ignored"}

    numero = data.get("phone")
    texto = data.get("text", {}).get("message", "").strip().lower()

    # Rate limit
    now = datetime.timestamp(datetime.now())
    last = ultima_interacao.get(numero, 0)
    if now - last < RATE_LIMIT_DELAY:
        return {"status": "rate_limited"}
    ultima_interacao[numero] = now

    # Se usuário digitar MENU → retorna menu
    if texto == "menu":
        user_context[numero] = "menu"
        await send_menu(numero)
        return {"status": "ok"}

    # Primeira interação → sempre menu
    if numero not in user_context:
        user_context[numero] = "menu"
        await send_menu(numero)
        return {"status": "ok"}

    # Se está no menu e digitou opção
    if user_context[numero] == "menu":
        if texto in ["1", "2", "3", "4", "5"]:
            opcoes = {
                "1": "monitoramento",
                "2": "planos",
                "3": "dicas",
                "4": "suporte",
                "5": "outros"
            }
            user_context[numero] = opcoes[texto]
            await send_assistente_inicial(numero, opcoes[texto])
            return {"status": "ok"}
        else:
            await send_menu(numero)
            return {"status": "ok"}

    # Após escolha → conversa normal com IA sem voltar ao menu
    resposta = await gerar_resposta_ia(numero, texto, user_context[numero])
    await send_whatsapp_safe(numero, resposta)
    return {"status": "ok"}

