import requests

ULTRA_INSTANCE_ID = "instance151649"
ULTRA_TOKEN = "fzzi92d48hnl0wjl "
ULTRA_API_URL = f"https://api.ultramsg.com/instance151649/messages/chat"

def send_whatsapp_ultra(number: str, message: str):
    payload = {
        "token": ULTRA_TOKEN,
        "to": number,
        "body": message,
        "priority": 1
    }

    response = requests.post(ULTRA_API_URL, data=payload)

    try:
        return response.json()
    except:
        return {"error": "Failed to decode response", "raw": response.text}
