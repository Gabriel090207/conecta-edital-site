from firebase_admin import firestore
from main import perform_monitoring_check, Monitoring
import asyncio
from datetime import datetime, timezone

db = firestore.client()

async def run_all_monitorings_core():
    print("🚀 Iniciando verificação geral...")

    docs = db.collection('monitorings').stream()
    count = 0

    async def process(doc):
        nonlocal count
        data = doc.to_dict()

        if not data:
            return

        if data.get("status") in ["inactive", "inativo", "disabled"]:
            return

        count += 1
        print(f"🔍 Verificando monitoramento: {doc.id} | Tipo: {data.get('monitoring_type')}")

        try:
            monitoring = Monitoring(
                id=doc.id,
                **data,
                created_at=data.get("created_at") or datetime.now(timezone.utc),
                last_checked_at=data.get("last_checked_at")
            )

            await perform_monitoring_check(monitoring)

        except Exception as e:
            print(f"❗Erro ao verificar {doc.id}: {str(e)}")

        # 🕒 sempre atualiza
        db.collection('monitorings').document(doc.id).update({
            "last_checked_at": firestore.SERVER_TIMESTAMP
        })

    tasks = [process(doc) for doc in docs]

    for i in range(0, len(tasks), 10):
        await asyncio.gather(*tasks[i:i+10])

    print(f"📊 Total verificados: {count}")
    print("✅ Verificação geral finalizada!")
