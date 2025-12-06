memoria_conversa = {}

def salvar_mensagem(numero, role, content):
    if numero not in memoria_conversa:
        memoria_conversa[numero] = []

    memoria_conversa[numero].append({
        "role": role,
        "content": content
    })

def obter_historico(numero):
    return memoria_conversa.get(numero, [])

def limpar_conversa(numero):
    if numero in memoria_conversa:
        memoria_conversa[numero] = []
