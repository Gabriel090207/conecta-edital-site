import asyncio
from monitor_core import run_all_monitorings_core

async def main_task():
    await run_all_monitorings_core()

if __name__ == "__main__":
    asyncio.run(main_task())

