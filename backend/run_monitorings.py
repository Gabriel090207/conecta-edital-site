import requests

URL = "https://conecta-edital-site-927y.onrender.com/run-monitorings-cron"

def main():
    try:
        print("🚀 Chamando endpoint oficial de monitoramentos...")
        r = requests.get(URL, timeout=600)
        print("✅ Status:", r.status_code)
        print("📄 Resposta:", r.text)
    except Exception as e:
        print("❌ Erro ao chamar o endpoint:", e)

if __name__ == "__main__":
    main()
