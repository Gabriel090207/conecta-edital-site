import asyncio
from datetime import datetime, timezone
from firebase_admin import firestore

from monitor_core import run_all_monitorings_core

db = firestore.client()

def salvar_status_cron():
    db.collection("system").document("cron_status").set(
        {
            "last_run_at": datetime.now(timezone.utc)
        },
        merge=True
    )

async def main_task():
    salvar_status_cron()
    await run_all_monitorings_core()

if __name__ == "__main__":
    asyncio.run(main_task())
