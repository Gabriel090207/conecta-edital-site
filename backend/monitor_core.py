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

        # ❌ pula apenas se estiver inativo
        if data.get("status") in ["inactive", "inativo", "disabled"]:
            return

        count += 1
        print(f"🔍 Verificando monitoramento: {doc.id} | Tipo: {data.get('monitoring_type')}")

        # ✅ REMOVE CAMPOS QUE SERÃO PASSADOS MANUALMENTE
        created_at = data.pop("created_at", None)
        last_checked_at = data.pop("last_checked_at", None)

        try:
            monitoring = Monitoring(
                id=doc.id,
                **data,
                created_at=created_at or datetime.now(timezone.utc),
                last_checked_at=last_checked_at
            )

            await perform_monitoring_check(monitoring)

        except Exception as e:
            print(f"❗Erro ao verificar {doc.id}: {str(e)}")

        # 🕒 ATUALIZA SEMPRE (TENHA OCORRÊNCIA OU NÃO)
        try:
            db.collection('monitorings').document(doc.id).update({
                "last_checked_at": firestore.SERVER_TIMESTAMP
            })
            print(f"⏱️ Última verificação registrada para {doc.id}")
        except Exception as e:
            print(f"❗Erro ao atualizar last_checked_at de {doc.id}: {e}")

    tasks = [process(doc) for doc in docs]

    # executa em blocos de 10
    for i in range(0, len(tasks), 10):
        await asyncio.gather(*tasks[i:i+10])

    print(f"📊 Total verificados: {count}")
    print("✅ Verificação geral finalizada!")
