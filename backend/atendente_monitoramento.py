from whatsapp_bot import send_whatsapp, send_typing
from memoria import salvar_mensagem, obter_historico, limpar_conversa
import asyncio
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def responder(numero, texto):
    print(f"📝 Monitoramento ativo para {numero} | Texto recebido: {texto}")

    # ==============================
    # VOLTAR AO MENU
    # ==============================
    if texto.lower().strip() in ["menu", "voltar", "início", "inicio"]:
        limpar_conversa(numero)
        await send_whatsapp(numero, "🔙 Você saiu do setor de Monitoramento.\nDigite *menu* para voltar ao início.")
        return {"status": "ok"}

    # ==============================
    # SALVAR MENSAGEM DO USUÁRIO
    # ==============================
    salvar_mensagem(numero, "user", texto)

    # ==============================
    # SINAL DIGITANDO
    # ==============================
    await send_typing(numero)
    await asyncio.sleep(1.2)

    # ==============================
    # CONTEXTO COM HISTÓRICO
    # ==============================
    historico = obter_historico(numero) or []
    historico = historico[-12:]  # pega últimos 12 turnos

    prompt = [
        {
            "role": "system",
            "content": (
                "Você é *Carlos*, atendente humano do setor de Monitoramento📊.\n"
                "Fale casual, curto e estilo WhatsApp.\n"
                "Use no máximo 1 emoji.\n"
                "Não pareça robô.\n"
                "Ajude sempre.\n"
                "Se o usuário estiver confuso, explique simples.\n"
                "Nunca diga que é IA."
            )
        }
    ]

    for msg in historico:
        prompt.append({"role": msg["role"], "content": msg["message"]})

    # ==============================
    # GERAR RESPOSTA
    # ==============================
    try:
        resposta = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=prompt,
            temperature=0.7,
            max_tokens=300
        )

        texto_resposta = resposta.choices[0].message.content.strip()

        # ==============================
        # SALVAR MENSAGEM DA IA
        # ==============================
        salvar_mensagem(numero, "assistant", texto_resposta)

        # ==============================
        # ENVIAR RESPOSTA
        # ==============================
        await send_whatsapp(numero, texto_resposta)
        print(f"📩 Resposta enviada a {numero}: {texto_resposta}")

        return {"status": "ok"}

    except Exception as e:
        print(f"❌ ERRO NO ATENDIMENTO MONITORAMENTO: {e}")

        await send_whatsapp(
            numero,
            "⚠️ Tive um problema aqui, mas já estou resolvendo. "
            "Tente novamente em alguns instantes ou envie *menu*."
        )

        return {"status": "error", "message": str(e)}
