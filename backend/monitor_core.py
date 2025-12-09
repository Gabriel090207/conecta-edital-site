# monitor_core.py

from firebase_admin import firestore
from main import perform_monitoring_check   # NÃO ALTERAR
import asyncio

db = firestore.client()


async def run_all_monitorings_core():
    print("🚀 Iniciando verificação geral...")

    # 🔥 Agora busca TODOS, sem filtro
    docs = db.collection('monitorings').stream()

    count = 0

    async def process(doc):
        nonlocal count
        data = doc.to_dict()

        if not data:
            return

        # ❗ Agora só pula se estiver claramente inativo
        if data.get("status") in ["inactive", "inativo", "disabled"]:
            return

        count += 1
        print(f"🔍 Verificando monitoramento: {doc.id} | Tipo: {data.get('monitoring_type')}")

        try:
            await perform_monitoring_check(doc.id, data)
        except Exception as e:
            print(f"❗Erro ao verificar {doc.id}: {str(e)}")

    tasks = []
    for doc in docs:
        tasks.append(process(doc))

    # executa 10 por vez para evitar limite de requisições
    for i in range(0, len(tasks), 10):
        batch = tasks[i:i+10]
        await asyncio.gather(*batch)

    print(f"📊 Total verificados: {count}")
    print("✅ Verificação geral finalizada!")
