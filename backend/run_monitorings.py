import asyncio
from main import run_all_monitorings   # importar direto do main.py

async def main_task():
    await run_all_monitorings()

if __name__ == "__main__":
    asyncio.run(main_task())
