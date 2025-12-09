# monitor_core.py
from main import perform_monitoring_check
from firebase_admin import firestore

async def run_all_monitorings_core():
    """
    Executa verificações automáticas de TODOS os monitoramentos ativos.
    Evita inicialização pesada do main.
    """
    print("🚀 Executando verificação automática (versão leve)...")

    db = firestore.client()
    monitorings_ref = db.collection('monitorings').where('status', '==', 'active')
    docs = monitorings_ref.stream()

    from main import Monitoring

    tasks = []
    for doc in docs:
        data = doc.to_dict()
        monitoring = Monitoring(
            id=doc.id,
            **data
        )
        tasks.append(perform_monitoring_check(monitoring))

    await asyncio.gather(*tasks, return_exceptions=True)
    print("✔️ Verificação finalizada")
