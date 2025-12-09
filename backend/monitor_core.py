# monitor_core.py
import asyncio
from firebase_admin import firestore
from main import perform_monitoring_check  # já existe no seu main

db = firestore.client()

async def run_all_monitorings_core():
    """
    Executa verificação de TODOS os monitoramentos direto no Firestore,
    sem rodar FastAPI, sem Twilio, sem Mercado Pago, sem CORS, sem nada extra.
    """
    print("🚀 Iniciando verificação geral...")
    
    monitoramentos_ref = db.collection("monitoramentos")
    monitoramentos = monitoramentos_ref.stream()

    tasks = []
    for m in monitoramentos:
        data = m.to_dict()
        monitor_id = m.id

        # pula monitoramentos inativos
        if data.get("status") != "active":
            continue

        print(f"🔍 Executando monitoramento: {monitor_id}")

        tasks.append(perform_monitoring_check(monitor_id, data))

    if tasks:
        await asyncio.gather(*tasks)

    print("✅ Verificação geral finalizada!")
