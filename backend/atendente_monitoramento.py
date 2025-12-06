from whatsapp_bot import send_whatsapp, send_typing
from memoria import salvar_mensagem, obter_historico
import asyncio
import os
from openai import OpenAI

# Inicializa o cliente OpenAI com sua chave de API
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def responder(numero, texto):
    # Salva a mensagem do usuário na memória (banco de dados ou arquivo)
    salvar_mensagem(numero, "user", texto)

    # Envia um sinal de digitação (typing) para indicar que o bot está processando a resposta
    await send_typing(numero)
    await asyncio.sleep(1)  # Aguarda um tempo antes de enviar a resposta para dar a sensação de um humano

    # Obtém o histórico de mensagens do usuário para fornecer contexto para o modelo GPT
    historico = obter_historico(numero)

    # Monta o prompt com o histórico das últimas mensagens (aqui limitamos a 10 últimas)
    prompt = [
        {"role": "system", "content": 
        """
        Você é Carlos, atendente de suporte do Conecta Edital.
        Você fala como humano: amigável, claro, explicando sem ser robótico.
        Nunca peça dados de monitoramento, nem link, nem ID.
        Seu papel é APENAS tirar dúvidas e orientar.
        Use sempre tom humano: "certo, entendi", "claro", "vamos lá".
        Respostas curtas e úteis, sem blocos enormes.
        """}
    ] + historico[-10:]  # Usa os 10 últimos turnos para manter o contexto da conversa

    try:
        # Chama a API do OpenAI para gerar a resposta com base no prompt
        resposta = client.chat.completions.create(
            model="gpt-4.1-mini",  # Modelo GPT-4.1 mini (você pode usar outro modelo se preferir)
            messages=prompt,
            temperature=0.6  # Ajusta a criatividade da resposta (0.6 é um valor equilibrado)
        )

        # Extrai a resposta gerada pelo modelo
        texto_resposta = resposta.choices[0].message["content"]

        # Salva a resposta do atendente (bot) na memória
        salvar_mensagem(numero, "assistant", texto_resposta)

        # Envia a resposta para o WhatsApp do usuário
        await send_whatsapp(numero, texto_resposta)

        # Retorna um status de sucesso
        return {"status": "ok"}

    except Exception as e:
        # Caso ocorra algum erro, registra e retorna um erro
        print(f"Erro ao gerar resposta: {e}")
        return {"status": "error", "message": str(e)}

