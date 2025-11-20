import asyncio
from monitorings import run_all_monitorings  # importe sua função real

async def main():
    await run_all_monitorings()

if __name__ == "__main__":
    asyncio.run(main())
