from fastapi import FastAPI, HTTPException, Body, BackgroundTasks, Depends, Request, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, EmailStr, Field
from typing import List, Optional, Dict, Union
import uuid
from datetime import datetime, timezone
import httpx
import io
from PyPDF2 import PdfReader
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import defaultdict
import hashlib
import random
import string



import json
import httpx

from fastapi import APIRouter


# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from firebase_admin.exceptions import FirebaseError
import json
import os
from twilio.rest import Client

import asyncio
from google.cloud.firestore_v1.base_query import FieldFilter
from dateutil.relativedelta import relativedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
# Mercado Pago SDK
import mercadopago

# Importação do módulo de serviço de pagamento
from payment_service import create_mercadopago_checkout_url, PREAPPROVAL_PLAN_IDS, PLANS

# Envio de email e variáveis de ambiente
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
from dotenv import load_dotenv
import smtplib

from whatsapp_bot import router as whatsapp_router


# Importação dos templates de email (se existirem)
import email_templates

from subscriptions import router as subscriptions_router
from webhook_mp import router as mp_webhook_router


app = FastAPI(
    title="API Conecta Edital",
    description="Backend para gerenciar monitoramentos de editais e concursos.",
    version="0.1.0"
)


app.include_router(subscriptions_router)
app.include_router(mp_webhook_router)
app.include_router(whatsapp_router)


router = APIRouter()

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# --- LEIA AS VARIÁVEIS DE AMBIENTE AQUI ---
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")

twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)


# ============================
# CONFIGURAÇÃO DA Z-API
# ============================

ZAPI_INSTANCE_ID = os.getenv("ZAPI_INSTANCE_ID")
ZAPI_TOKEN = os.getenv("ZAPI_TOKEN")
 # Substitua pelo seu token


import json
import httpx


# =====================================
def send_whatsapp_zapi(to_number: str, message: str):
    cleaned = "".join(filter(str.isdigit, to_number))

    if cleaned.startswith("55"):
        cleaned = cleaned[2:]

    cleaned = "55" + cleaned

    url = f"https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/send-text"

    headers = {
        "client-token": os.getenv("ZAPI_CLIENT_TOKEN"),
        "instance-token": ZAPI_TOKEN,
        "Authorization": f"Bearer {ZAPI_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "phone": cleaned,
        "message": message
    }

    try:
        print("DEBUG ZAPI PAYLOAD:", payload)
        print("DEBUG ZAPI URL:", url)

        response = httpx.post(url, json=payload, headers=headers)
        print("DEBUG ZAPI RESPONSE:", response.text)

        response.raise_for_status()
        return {"status": "success", "response": response.json()}
    except Exception as e:
        print("Erro ao enviar pela Z-API:", str(e))
        return {"status": "error", "detail": str(e)}


# 🔐 LOCK GLOBAL PARA EVITAR DUPLICAÇÃO
from asyncio import Lock
whatsapp_lock = Lock()


async def send_whatsapp_safe(to_number: str, message: str):
    try:
        async with whatsapp_lock:
            send_whatsapp_zapi(to_number, message)
            await asyncio.sleep(12)  # delay obrigatório anti-spam
        return {"status": "success"}

    except Exception as e:
        print("Erro ao enviar pela Z-API:", str(e))
        return {"status": "error", "detail": str(e)}



def send_template_visual_zapi(to_number: str, titulo: str, data: str, link: str):
    """
    Replica o mesmo visual do template UltraMSG usando texto normal no Z-API.
    """

    def sanitize(text: str) -> str:
        return text.replace("\n\n", "\n").replace("  ", " ").strip()

    mensagem = sanitize(
        f"📢 *ATUALIZAÇÃO NO EDITAL*\n"
        f"*Título:* {titulo}\n"
        f"*Data:* {data}\n"
        f"📄 Acesse o documento completo: {link}\n"
        f"Conecta Edital — Monitoramento Inteligente de Editais."
    )

    return send_whatsapp_zapi(to_number, mensagem)


@app.get("/")
def read_root():
    return {"message": "API Conecta Edital está funcionando!"}

@app.post("/send-message/")
async def send_message(to_number: str, message: str):
    response = send_whatsapp_zapi(to_number, message)
    return response

# Configuração do CORS
origins = [
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5500",
    "https://conecta-edital-site-927y.onrender.com",
    "https://paineldeadminconectaedital.netlify.app",
    "https://siteconectaedital.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INICIALIZAÇÃO DO FIREBASE ADMIN SDK ---
try:
    firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_credentials_json:
        cred_dict = json.loads(firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
        print("Firebase Admin SDK inicializado com sucesso da variável de ambiente!")
    else:
        if os.path.exists("chave-firebase.json"):
            cred = credentials.Certificate("chave-firebase.json")
            print("Firebase Admin SDK inicializado com sucesso do arquivo local!")
        else:
            raise ValueError("Nenhum arquivo 'chave-firebase.json' ou variável de ambiente 'FIREBASE_CREDENTIALS_JSON' encontrado.")
    
    firebase_admin.initialize_app(cred, {'storageBucket': FIREBASE_STORAGE_BUCKET})
    print("Firebase Admin SDK inicializado com sucesso!")
except Exception as e:
    print(f"ERRO ao inicializar Firebase Admin SDK: {e}")
    print("Verifique se o arquivo 'chave-firebase.2json' está na raiz do seu projeto backend OU se a variável de ambiente 'FIREBASE_CREDENTIALS_JSON' está configurada.")


# Models Pydantic
class NewPersonalMonitoring(BaseModel):
    link_diario: HttpUrl
    id_edital: str
    nome_completo: str

class NewRadarMonitoring(BaseModel):
    link_diario: HttpUrl
    id_edital: str

from pydantic import field_validator

class Monitoring(BaseModel):
    id: str
    monitoring_type: str
    official_gazette_link: HttpUrl
    edital_identifier: str
    candidate_name: Optional[str] = None
    cpf: Optional[str] = None
    keywords: Union[str, List[str]]  # ✅ aceita string ou lista
    last_checked_at: datetime
    last_pdf_hash: Optional[str] = None
    occurrences: int = 0
    status: str = "inactive"
    created_at: datetime
    user_uid: str
    user_email: str
    nome_customizado: Optional[str] = None
    pdf_real_link: Optional[HttpUrl] = None  # Novo campo

    @field_validator("keywords", mode="before")
    def normalize_keywords(cls, v):
        """Garante que keywords seja sempre uma string."""
        if isinstance(v, list):
            return ", ".join(map(str, v))
        return v



class CreatePreferenceRequest(BaseModel):
    plan_id: str
    user_email: str

# Modelos para a funcionalidade de tickets
class Attachment(BaseModel):
    filename: str
    content_type: str
    size: int
    url: Optional[str] = None

class TicketMessage(BaseModel):
    sender: str
    text: str
    timestamp: datetime
    attachments: List[Attachment] = []

class Ticket(BaseModel):
    id: str
    user_uid: str
    user_email: str
    subject: str
    status: str
    category: str # NOVO CAMPO
    created_at: datetime
    last_updated_at: datetime
    messages: List[TicketMessage] = []
    assignee: Optional[str] = "Não Atribuído"

class NewTicket(BaseModel):
    subject: str
    category: str # NOVO CAMPO
    initial_message: str

class UserReply(BaseModel):
    text: str

class AdminReply(BaseModel):
    text: str

class TicketStatusUpdate(BaseModel):
    status: str
    
# Novo Modelo para o Teste de Monitoramento
class TestMonitoringData(BaseModel):
    keyword: str
    email: EmailStr

# Novo Pydantic Model para as Dicas
class Dica(BaseModel):
    id: Optional[str] = None
    titulo: str
    autor: str
    topico: str
    conteudo: str
    data_criacao: datetime = Field(default_factory=datetime.now)
    visualizacoes: int = 0
    
# NOVO MODELO PARA ARTIGO
class Article(BaseModel):
    id: Optional[str] = None
    titulo: str
    autor: str
    topico: str
    conteudo: str
    data_criacao: datetime = Field(default_factory=datetime.now)
    visualizacoes: int = 0


# NOVO MODELO PARA FAQ
class FAQ(BaseModel):
    id: Optional[str] = None
    pergunta: str
    resposta: str
    categoria: str
    popular: Optional[bool] = False
    visualizacoes: int = 0

# NOVO MODELO PARA OS DADOS DO USUÁRIO
class UserData(BaseModel):
    fullName: str
    username: str
    email: EmailStr
    plan_type: str
    photoURL: Optional[str] = None
    contact: Optional[str] = None
    
# NOVO MODELO PARA ATUALIZAÇÃO DO USUÁRIO
class UserProfileUpdate(BaseModel):
    fullName: str | None = None
    username: str | None = None # NOVO CAMPO
    photoURL: str | None = None
    contact: str | None = None  
    
# NOVO MODELO PARA ATUALIZAÇÃO DO PERFIL POR ADMIN


class AdminProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    plan_type: Optional[str] = None

    # 🔥 Campo dos slots — sem acento e com alias aceitando "slots_disponiveis"
    slots_disponiveis: Optional[int] = Field(None, alias="slots_disponiveis")

    class Config:
        allow_popoulation_by_field_name = True
        allow_population_by_alias = True




# Quando você detectar uma nova ocorrência e ativar o monitoramento
async def monitorar_ativacao(monitoramento: Monitoring):
    # Se o usuário estiver com o plano Premium, envia as mensagens
    user_phone = "número_do_usuário_aqui"  # Isso deve ser obtido do banco de dados
    await send_monitoring_and_occurrence_notifications(monitoramento, user_phone)

# Dependência de Autenticação Firebase
async def get_current_user_uid(request: Request) -> str:
    """
    Dependência FastAPI para verificar o token de autenticação Firebase.
    Retorna o UID do usuário autenticado.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=401, detail="Token de autenticação não fornecido"
        )

    token = auth_header.split("Bearer ")[1] if "Bearer " in auth_header else None
    if not token:
        raise HTTPException(
            status_code=401, detail="Formato de token inválido (esperado 'Bearer <token>')"
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        print(f"Token Firebase verificado com sucesso para UID: {uid}")
        return uid
    except FirebaseError as e:
        print(f"ERRO: Falha na verificação do token Firebase: {e}")
        raise HTTPException(
            status_code=401, detail=f"Token Firebase inválido ou expirado: {e}"
        )
    except Exception as e:
        print(f"ERRO: Erro inesperado ao processar token: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")


# FUNÇÃO DE AUTENTICAÇÃO DE ADMIN
async def get_current_admin_uid(request: Request) -> str:
    """
    Dependência FastAPI para verificar o token de autenticação Firebase
    e garantir que o usuário seja um administrador.
    """
    uid = await get_current_user_uid(request)
    db = firestore.client()
    admin_ref = db.collection('admins').document(uid)
    if not admin_ref.get().exists:
        print(f"ALERTA: Usuário UID {uid} tentou acessar rota de admin sem permissão.")
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para acessar esta área."
        )
    return uid


# Função para obter o email do usuário do Firestore
async def get_user_email_from_firestore(uid: str) -> Optional[str]:
    db_firestore_client = firestore.client()
    user_ref = db_firestore_client.collection('users').document(uid)
    user_doc = user_ref.get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        return user_data.get('email')
    print(f"ALERTA: Documento de usuário não encontrado no Firestore para UID: {uid}")
    return 'email_nao_encontrado@exemplo.com'

# Função para obter o tipo de plano do usuário do Firestore
async def get_user_plan_from_firestore(uid: str) -> str:
    """
    Busca o tipo de plano do usuário no Firestore, normalizando nomes e cobrindo campos antigos.
    """
    db_firestore_client = firestore.client()
    user_ref = db_firestore_client.collection('users').document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        print(f"⚠️ Usuário {uid} não encontrado no Firestore — retornando 'sem plano'")
        return "sem_plano"

    user_data = user_doc.to_dict()

    # Tenta encontrar o campo correto
    plan_raw = (
        user_data.get("plan_type") or
        user_data.get("plano") or
        user_data.get("plan") or
        "sem_plano"
    )

    plan_normalizado = str(plan_raw).strip().lower()

    # 🔹 Corrige possíveis variações
    if "premium" in plan_normalizado:
        return "premium"
    elif "essencial" in plan_normalizado:
        return "essencial"
    elif "basico" in plan_normalizado or "básico" in plan_normalizado:
        return "basico"
    elif plan_normalizado in ["sem_plano", "sem plano", "gratuito", "free"]:
        return "sem_plano"

    return plan_normalizado


# Função para determinar o número máximo de slots com base no plano
def get_max_slots_by_plan(plan_type: str) -> int:
    if plan_type == 'premium':
        return float('inf')
    elif plan_type == 'essencial':
        return 3
    else:
        return 0

# Funções de Lógica de Negócio (existentes)
async def fetch_content(url: HttpUrl) -> Optional[httpx.Response]:
    """Baixa o conteúdo de uma URL e retorna o objeto httpx.Response."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(url), follow_redirects=True, timeout=20)
            response.raise_for_status()
            return response
    except httpx.RequestError as exc:
        print(f"ERRO: Não foi possível acessar {url} - {exc}")
    except Exception as e:
        print(f"ERRO: Inesperado ao baixar conteúdo de {url}: {e}")
    return None

async def find_pdf_in_html(html_content: bytes, base_url: HttpUrl) -> Optional[HttpUrl]:
    """Tenta encontrar um link para PDF dentro de um conteúdo HTML."""
    soup = BeautifulSoup(html_content, 'html.parser')
    pdf_links_found = []
    
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        link_text = a_tag.get_text().lower()

        if href.lower().endswith('.pdf'):
            if not href.startswith(('http://', 'https://')):
                full_pdf_url = urljoin(str(base_url), href)
            else:
                full_pdf_url = href
            
            try:
                pdf_url_obj = HttpUrl(full_pdf_url)
                if "edital" in link_text or "anexo" in link_text or "completo" in link_text or "gabarito" in link_text or "resultado" in link_text or "aviso" in link_text:
                    pdf_links_found.insert(0, pdf_url_obj)
                else:
                    pdf_links_found.append(pdf_url_obj)
                
                print(f"DEBUG: Link PDF encontrado no HTML: {pdf_url_obj} (Texto: '{link_text}')")
            except Exception as e:
                print(f"ALERTA: Link inválido encontrado no HTML: {full_pdf_url} - {e}")
            
    if pdf_links_found:
        return pdf_links_found[0]
    
    return None

async def get_pdf_content_from_url(url: HttpUrl) -> Optional[tuple[bytes, str]]:
    """
    Retorna o conteúdo PDF e o link final do PDF (caso o original seja uma página HTML).
    """
    print(f"DEBUG: Tentando obter conteúdo de: {url}")
    
    response = await fetch_content(url)
    if not response:
        return None

    content_type = response.headers.get('Content-Type', '').lower()

    # Caso seja um PDF direto
    if 'application/pdf' in content_type:
        print(f"DEBUG: URL {url} é um PDF direto.")
        return response.content, str(url)
    
    # Caso seja HTML — procurar link PDF dentro
    if 'text/html' in content_type:
        print(f"DEBUG: URL {url} é HTML. Procurando links PDF dentro...")
        pdf_url_in_html = await find_pdf_in_html(response.content, url)
        if pdf_url_in_html:
            print(f"DEBUG: PDF encontrado: {pdf_url_in_html}")
            pdf_response = await fetch_content(pdf_url_in_html)
            if pdf_response and 'application/pdf' in pdf_response.headers.get('Content-Type', '').lower():
                return pdf_response.content, str(pdf_url_in_html)
            else:
                print(f"ALERTA: O link encontrado ({pdf_url_in_html}) não retornou um PDF válido.")
        else:
            print(f"ALERTA: Nenhum PDF encontrado em {url}.")
    else:
        print(f"ALERTA: Tipo de conteúdo inesperado ({content_type}).")

    return None


async def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extrai texto de conteúdo PDF binário."""
    try:
        reader = PdfReader(io.BytesIO(pdf_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"ERRO: Ao extrair texto do PDF: {e}")
        return ""

def send_email_notification(
    monitoramento: Monitoring,
    template_type: str,
    to_email: str,
    found_keywords: Optional[List[str]] = None
):

    print("📤 Iniciando envio de e-mail...")
    print(f"➡️ Tipo de template: {template_type}")
    print(f"➡️ Destinatário: {to_email}")
    print(f"➡️ Edital: {monitoramento.edital_identifier}")
    print(f"➡️ Link do PDF real: {getattr(monitoramento, 'pdf_real_link', 'N/A')}")

    """
    Envia uma notificação por e-mail com base no template especificado.
    """
    if not all([SMTP_HOST, EMAIL_ADDRESS, EMAIL_PASSWORD, to_email]):
        print("ERRO: Credenciais de e-mail ou destinatário ausentes. Não é possível enviar e-mail.")
        return

    html_content = ""
    subject = ""
    user_full_name_from_monitoramento = ""
    try:
        db_firestore_client = firestore.client()
        user_doc_ref = db_firestore_client.collection('users').document(monitoramento.user_uid)
        user_doc = user_doc_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_full_name_from_monitoramento = user_data.get('fullName', monitoramento.user_email.split('@')[0])
        else:
            user_full_name_from_monitoramento = monitoramento.user_email.split('@')[0]
    except Exception as e:
        print(f"ALERTA: Não foi possível buscar fullName do Firestore para email. Usando parte do email. Erro: {e}")
        user_full_name_from_monitoramento = monitoramento.user_email.split('@')[0]

    if template_type == 'monitoring_active':
        html_content = email_templates.get_monitoring_active_email_html(
            user_full_name=user_full_name_from_monitoramento,
            monitoring_type=monitoramento.monitoring_type,
            official_gazette_link=str(monitoramento.official_gazette_link),
            edital_identifier=monitoramento.edital_identifier,
            candidate_name=monitoramento.candidate_name,
            keywords=monitoramento.keywords
        )
        subject = f"Conecta Edital: Seu Monitoramento para '{monitoramento.edital_identifier}' está Ativo!"
    elif template_type == 'occurrence_found':
        if not found_keywords:
            print("ALERTA: found_keywords é necessário para o template 'occurrence_found'.")
            return

        html_content = email_templates.get_occurrence_found_email_html(
        user_full_name=user_full_name_from_monitoramento,
        edital_identifier=monitoramento.edital_identifier,
        official_gazette_link=str(
            getattr(monitoramento, "pdf_real_link", monitoramento.official_gazette_link)
        ),
        found_keywords=found_keywords
    )

        subject = f"Conecta Edital: Nova Ocorrência Encontrada no Edital '{monitoramento.edital_identifier}'"
    else:
        print(f"ERRO: Tipo de template de email desconhecido: {template_type}")
        return

    msg = MIMEText(html_content, 'html', 'utf-8')
    
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = formataddr((str(Header('Conecta Edital', 'utf-8')), EMAIL_ADDRESS))
    msg['To'] = to_email

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
                smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
                smtp.starttls()
                smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                smtp.send_message(msg)
        print(f"E-mail de notificação ENVIADO com sucesso para {to_email} (Tipo: {template_type}).")
    except smtplib.SMTPAuthenticationError:
        print("ERRO: Falha de autenticação SMTP. Verifique seu EMAIL_ADDRESS e EMAIL_PASSWORD/App Password.")
    except smtplib.SMTPConnectError as e:
        print(f"ERRO: Falha ao conectar ao servidor SMTP {SMTP_HOST}:{SMTP_PORT} - {e}. Verifique o HOST e a PORTA.")
    except Exception as e:
        print(f"ERRO: Erro inesperado ao enviar e-mail: {e}")
# ===============================================================
# 🔔 Função de Criação de Notificações (Fora de qualquer rota!)
# ===============================================================

# ===============================================================
# 🔍 Função principal de verificação de monitoramentos
# ===============================================================

async def perform_monitoring_check(monitoramento: Monitoring):
    """
    Executa a verificação para um monitoramento específico.
    Dispara email e WhatsApp (modelo novo) quando uma ocorrência é encontrada.
    Armazena o link real do PDF e o histórico.
    """

    print(f"\n--- Iniciando verificação para monitoramento {monitoramento.id} ({monitoramento.monitoring_type}) do usuário {monitoramento.user_uid} ---")

    db = firestore.client()
    doc_ref = db.collection("monitorings").document(monitoramento.id)

    # ======================================================
    # 1️⃣ TENTAR OBTER O PDF REAL
    # ======================================================
    print(f"Tentando obter o PDF real de: {monitoramento.official_gazette_link}")

    response = await fetch_content(monitoramento.official_gazette_link)
    if not response:
        print(f"❌ Falha ao acessar {monitoramento.official_gazette_link}")
        return

    content_type = response.headers.get("Content-Type", "").lower()
    pdf_content = None
    pdf_real_url = None

    if "application/pdf" in content_type:
        pdf_real_url = str(monitoramento.official_gazette_link)
        pdf_content = response.content

    elif "text/html" in content_type:
        pdf_url_in_html = await find_pdf_in_html(response.content, monitoramento.official_gazette_link)
        if not pdf_url_in_html:
            print(f"⚠️ Nenhum PDF encontrado na página {monitoramento.official_gazette_link}")
            return

        pdf_real_url = str(pdf_url_in_html)
        print(f"🔗 PDF encontrado dentro da página: {pdf_real_url}")

        pdf_response = await fetch_content(pdf_url_in_html)
        if pdf_response and "application/pdf" in pdf_response.headers.get("Content-Type", "").lower():
            pdf_content = pdf_response.content
        else:
            print(f"⚠️ O link encontrado não é um PDF válido: {pdf_url_in_html}")
            return

    else:
        print(f"⚠️ Tipo de conteúdo inesperado: {content_type}")
        return

    # ======================================================
    # 2️⃣ CALCULAR HASH → VER SE O PDF MUDOU
    # ======================================================
    current_pdf_hash = hashlib.sha256(pdf_content).hexdigest()
    doc = doc_ref.get()

    if doc.exists and doc.to_dict().get("last_pdf_hash") == current_pdf_hash:
        print(f"PDF para {monitoramento.id} não mudou desde a última verificação.")
        doc_ref.update({"last_checked_at": firestore.SERVER_TIMESTAMP})
        return

    doc_ref.update({
        "last_pdf_hash": current_pdf_hash,
        "last_checked_at": firestore.SERVER_TIMESTAMP
    })

    # ======================================================
    # 3️⃣ EXTRAIR TEXTO DO PDF
    # ======================================================
    pdf_text = await extract_text_from_pdf(pdf_content)
    pdf_text_lower = pdf_text.lower()

    # ======================================================
    # 4️⃣ VERIFICAR PALAVRAS-CHAVE
    # ======================================================
    found_keywords = []
    keywords_to_search = [monitoramento.edital_identifier]

    if monitoramento.monitoring_type == "personal" and monitoramento.candidate_name:
        keywords_to_search.append(monitoramento.candidate_name)

    # Verifica no texto e no nome do arquivo
    try:
        parsed_url = urlparse(pdf_real_url)
        file_name = parsed_url.path.split("/")[-1].lower()
    except:
        file_name = ""

    for kw in keywords_to_search:
        if kw.lower() in pdf_text_lower or kw.lower() in file_name:
            found_keywords.append(kw)

    # ======================================================
    # 5️⃣ NOVA OCORRÊNCIA ENCONTRADA
    # ======================================================
    if found_keywords:
        print(f"✅ Ocorrência detectada: {found_keywords}")

        # Armazena ocorrência no Firestore
        ocorrencias_ref = doc_ref.collection("occurrences")
        ocorrencias_ref.add({
            "edital_identifier": monitoramento.edital_identifier,
            "pdf_real_link": pdf_real_url,
            "official_gazette_link": str(monitoramento.official_gazette_link),
            "last_pdf_hash": current_pdf_hash,
            "detected_at": firestore.SERVER_TIMESTAMP
        })

        # Atualiza contador
        occ_total = len(list(ocorrencias_ref.stream()))
        doc_ref.update({
            "occurrences": occ_total,
            "pdf_real_link": pdf_real_url
        })

        print(f"🔄 Contador sincronizado: occurrences = {occ_total}")

        # Notificação interna (painel)
        await create_notification(
            user_uid=monitoramento.user_uid,
            type_="nova_ocorrencia",
            title="Nova ocorrência encontrada!",
            message=f"Encontramos uma nova ocorrência no edital '{monitoramento.edital_identifier}'.",
            link="/meus-monitoramentos"
        )

        monitoramento.pdf_real_link = pdf_real_url

        # ==================================================
        # ✉️ EMAIL (template atualizado)
        # ==================================================
        send_email_notification(
            monitoramento=monitoramento,
            template_type="occurrence_found",
            to_email=monitoramento.user_email,
            found_keywords=found_keywords
        )

        # ==================================================
        # 📲 WHATSAPP (template moderno da nova função)
        # ==================================================
        try:
            user_doc = db.collection("users").document(monitoramento.user_uid).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()

                user_phone = user_data.get("contact")
                user_plan = user_data.get("plan_type", "sem_plano").lower()
                user_name = user_data.get("fullName") or monitoramento.user_email.split("@")[0]

                if user_plan == "premium" and user_phone:

                    # Corrige keywords caso estejam em string
                    if isinstance(monitoramento.keywords, str):
                        kws = [kw.strip() for kw in monitoramento.keywords.split(",")]
                    else:
                        kws = monitoramento.keywords

                    # formatar keywords sem repetir ">"
                    
                    keywords_formatted = "\n".join([f"`{kw}`" for kw in keywords_list])

                    occurs_msg = (
                        f"> 🚨 *NOVA ATUALIZAÇÃO ENCONTRADA* 🚨\n"
                        f"\n"
                        f"Olá, *{user_name}!* 👋\n"
                        f"\n"
                        f"Encontramos uma atualização relevante no seu monitoramento. "
                        f"Recomendamos que confira o quanto antes.\n"
                        f"\n"
                        f"🔠 *PALAVRA-CHAVE SENDO MONITORADA*\n"
                        f"> {keywords_formatted}\n"
                        f"\n"
                        f"📎 *Quer todos os detalhes da ocorrência? Acesse o link abaixo:* \n"
                        f"{monitoramento.pdf_real_link}\n"
                        f"\n"
                        f"#Nomeação #ConcursoPúbIico #ConectaEdital #SuaVagaGarantida"
                    )


                    await send_whatsapp_safe(user_phone, occurs_msg)
                    print(f"📲 WhatsApp enviado (ocorrência única) para {user_phone}")

# ⏳ Delay fixo para evitar filtro anti-spam
                    



                else:
                    print("ℹ️ Usuário não premium ou sem número salvo.")

        except Exception as e:
            print(f"❌ ERRO ao enviar WhatsApp: {e}")

        print(f"🏁 Ocorrência finalizada para {monitoramento.id} — PDF real: {pdf_real_url}")

    else:
        print(f"❌ Nenhuma ocorrência encontrada para {monitoramento.id}.")

    print(f"--- Verificação para {monitoramento.id} concluída ---\n")


async def get_user_plan(uid: str) -> str:
    """
    Retorna o tipo de plano do usuário baseado no Firestore.
    Se não existir, retorna 'sem_plano'.
    """
    try:
        db = firestore.client()
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return "sem_plano"

        user_data = user_doc.to_dict()
        plan_type = user_data.get("plan_type", "sem_plano")

        return plan_type.lower()

    except Exception as e:
        print(f"Erro ao obter plano do usuário {uid}: {e}")
        return "sem_plano"


# 🔔 Função de Criação de Notificações (Fora de qualquer rota!)
# ===============================================================
async def create_notification(user_uid: str, type_: str, title: str, message: str, link: str = "#"):
    """
    Cria uma notificação no Firestore para o usuário especificado.
    """
    db = firestore.client()
    notif_ref = db.collection("notifications").document(user_uid).collection("items").document()

    data = {
        "type": type_,
        "title": title,
        "message": message,
        "link": link,
        "is_read": False,
        "created_at": firestore.SERVER_TIMESTAMP
    }

    notif_ref.set(data)
    print(f"🔔 Notificação criada para {user_uid}: {title}")

# ===============================================================
# ===============================================================
# 🕒 NOVO AGENDADOR DE VERIFICAÇÕES (05:45 e 23:45)
# ===============================================================

scheduler = AsyncIOScheduler()

async def run_all_monitorings():
    """
    Executa verificações automáticas de TODOS os monitoramentos ativos.
    """
    print("🚀 Executando verificação automática de todos os monitoramentos ativos...")
    db = firestore.client()
    monitorings_ref = db.collection('monitorings').where('status', '==', 'active')
    docs = monitorings_ref.stream()

    tasks = []
    for doc in docs:
       
        data = doc.to_dict()

        created_at = data.pop("created_at", datetime.now())
        last_checked_at = data.pop("last_checked_at", datetime.now())

        monitoring = Monitoring(
            id=doc.id,
            **data,
            created_at=created_at,
            last_checked_at=last_checked_at
        )

        tasks.append(perform_monitoring_check(monitoring))

    # Executa todos os monitoramentos em paralelo (sem travar)
    await asyncio.gather(*tasks, return_exceptions=True)
    print("✅ Verificação automática concluída com sucesso.")

    # Loga execução no Firestore (opcional)
    try:
        db.collection("system_logs").add({
            "type": "cron_check",
            "executed_at": firestore.SERVER_TIMESTAMP,
            "total_monitorings": len(tasks)
        })
    except Exception as e:
        print(f"⚠️ Erro ao salvar log da verificação: {e}")


# Função para enviar notificação quando monitoramento é ativado (somente para usuários PREMIUM)
# Função para enviar notificação quando monitoramento é ativado (somente para usuários PREMIUM)
async def send_whatsapp_notification(monitoramento: Monitoring, user_plan: str):
    try:
        if user_plan != "premium":
            print(f"ℹ️ Usuário {monitoramento.user_uid} não é premium. WhatsApp não enviado.")
            return

        db = firestore.client()
        user_doc = db.collection("users").document(monitoramento.user_uid).get()
        if not user_doc.exists:
            print("⚠️ Usuário não encontrado para WhatsApp")
            return

        user_data = user_doc.to_dict()
        user_phone = user_data.get("contact")
        user_name = user_data.get("fullName") or monitoramento.user_email.split("@")[0]

        if not user_phone:
            print("⚠️ Usuário sem telefone cadastrado, WhatsApp não enviado.")
            return

        # Formatação correta das keywords
        keywords = monitoramento.keywords
        if isinstance(keywords, str):
            keywords_list = [kw.strip() for kw in keywords.split(",")]
        else:
            keywords_list = keywords

        keywords_formatted = "\n".join([f"`{kw}`" for kw in keywords_list])

        activation_message = (
            f"> *MONITORAMENTO ATIVADO* ✅\n"
            f"\n"
            f"Olá, *{user_name}!* 👋\n"
            f"Perfeito! Seu sistema de monitoramento está configurado e pronto para enviar as atualizações automaticamente.\n"
            f"\n"
            f"📰 *DIÁRIO OFICIAL CONFIGURADO*\n"
            f"{monitoramento.official_gazette_link}\n"
            f"\n"
            f"🔠 *PALAVRA-CHAVE SENDO MONITORADA*\n"
            f"> {keywords_formatted}\n"
            f"\n"
            f"A partir de agora, você não precisa fazer mais nada.\n"
            f"Sempre que surgirem novas atualizações relacionadas à palavra-chave configurada, você será notificado.\n"
            
        )


        await send_whatsapp_safe(user_phone, activation_message)
        print(f"📲 WhatsApp de ativação enviado para {user_phone}")

        # ⏳ Delay fixo para não bloquear WhatsApp (evita ghost)
        

    except Exception as e:
        print(f"❌ ERRO ao enviar WhatsApp de ativação: {e}")

     
@router.get("/teste-ultramsg")
def teste_ultramsg():
    numero = "+5516994288026"  # seu número

    resposta = send_whatsapp_ultra(
        number=numero,
        message="🚀 UltraMSG integrado com sucesso!"
    )

    return resposta

app.include_router(router)

@app.get("/run-monitorings-cron")
async def run_monitorings_cron():
    """
    Endpoint para ser chamado manualmente ou via CRON no Render.
    """
    print("🌐 Endpoint /run-monitorings-cron chamado")
    await run_all_monitorings()
    return {"status": "ok"}


@app.post("/api/sync-occurrences")
async def sync_occurrences():
    """
    Sincroniza o campo 'occurrences' de cada monitoramento com
    a quantidade real de documentos na subcoleção 'occurrences'.
    """
    db = firestore.client()
    monitorings_ref = db.collection("monitorings")
    monitorings_docs = monitorings_ref.stream()

    updated_count = 0
    for doc in monitorings_docs:
        doc_id = doc.id
        occ_ref = monitorings_ref.document(doc_id).collection("occurrences")
        occ_docs = list(occ_ref.stream())
        occ_total = len(occ_docs)

        if doc.to_dict().get("occurrences", 0) != occ_total:
            monitorings_ref.document(doc_id).update({"occurrences": occ_total})
            updated_count += 1
            print(f"📊 Atualizado monitoramento {doc_id} → occurrences = {occ_total}")

    return {"message": f"Sincronização concluída! {updated_count} monitoramento(s) corrigido(s)."}

# Endpoints da API
@app.get("/")
async def read_root():
    return {"message": "Bem-vindo à API Conecta Edital!"}

# --- ROTA LISTAR MONITORAMENTOS ---
@app.get("/api/monitoramentos", response_model=List[Monitoring])
async def list_monitoramentos(user_uid: str = Depends(get_current_user_uid)):
    """
    Retorna a lista de todos os monitoramentos do usuário atual.
    """
    print(f"Buscando monitoramentos para UID: {user_uid}")
    db_firestore_client = firestore.client()
    monitorings_ref = db_firestore_client.collection('monitorings').where(filter=FieldFilter('user_uid', '==', user_uid))
    monitorings_docs = monitorings_ref.stream()
    
    monitorings_list = []
    for doc in monitorings_docs:
        monitorings_list.append(Monitoring(id=doc.id, **doc.to_dict()))
        
    return monitorings_list


@app.post("/api/monitoramentos/pessoal", response_model=Monitoring, status_code=201)
async def create_personal_monitoramento(
    monitoramento_data: NewPersonalMonitoring,
    background_tasks: BackgroundTasks,
    user_uid: str = Depends(get_current_user_uid)
):
    db_firestore_client = firestore.client()
    user_monitorings_count = len(list(
        db_firestore_client.collection('monitorings')
        .where(filter=FieldFilter('user_uid', '==', user_uid))
        .stream()
    ))

    user_plan_for_creation = await get_user_plan_from_firestore(user_uid)
    max_slots = get_max_slots_by_plan(user_plan_for_creation)

    if user_monitorings_count >= max_slots:
        raise HTTPException(
            status_code=403,
            detail="Limite de slots de monitoramento atingido. Faça upgrade do seu plano para adicionar mais!"
        )

    user_email = await get_user_email_from_firestore(user_uid)
    if not user_email:
        raise HTTPException(status_code=404, detail="E-mail do usuário não encontrado no Firestore.")

    new_monitoring_dict = {
        'monitoring_type': 'personal',
        'official_gazette_link': str(monitoramento_data.link_diario),
        'edital_identifier': monitoramento_data.id_edital,
        'candidate_name': monitoramento_data.nome_completo,
        'keywords': f"{monitoramento_data.nome_completo}, {monitoramento_data.id_edital}",
        'last_checked_at': firestore.SERVER_TIMESTAMP,
        'last_pdf_hash': None,
        'occurrences': 0,
        'status': 'active',
        'created_at': firestore.SERVER_TIMESTAMP,
        'user_uid': user_uid,
        'user_email': user_email
    }

    _, doc_ref = db_firestore_client.collection('monitorings').add(new_monitoring_dict)

    new_monitoring_obj = Monitoring(
        id=doc_ref.id,
        **{**new_monitoring_dict, 'last_checked_at': datetime.now(), 'created_at': datetime.now()}
    )

    # 📧 Envio de e-mail
    background_tasks.add_task(
        send_email_notification,
        monitoramento=new_monitoring_obj,
        template_type='monitoring_active',
        to_email=new_monitoring_obj.user_email
    )

    # 📲 Envio de WhatsApp via UltraMSG (Somente Premium)
    asyncio.create_task(send_whatsapp_notification(new_monitoring_obj, user_plan_for_creation))


    print(f"Novo Monitoramento Pessoal criado para UID {user_uid}: {new_monitoring_obj.dict()}")
    return new_monitoring_obj

@app.post("/api/monitoramentos/radar", response_model=Monitoring, status_code=201)
async def create_radar_monitoramento(
    monitoramento_data: NewRadarMonitoring,
    background_tasks: BackgroundTasks,
    user_uid: str = Depends(get_current_user_uid)
):
    db_firestore_client = firestore.client()
    user_monitorings_count = len(list(
        db_firestore_client.collection('monitorings')
        .where(filter=FieldFilter('user_uid', '==', user_uid))
        .stream()
    ))

    user_plan_for_creation = await get_user_plan_from_firestore(user_uid)
    max_slots = get_max_slots_by_plan(user_plan_for_creation)

    if user_monitorings_count >= max_slots:
        raise HTTPException(
            status_code=403,
            detail="Limite de slots de monitoramento atingido."
        )

    user_email = await get_user_email_from_firestore(user_uid)
    if not user_email:
        raise HTTPException(status_code=404, detail="E-mail do usuário não encontrado.")

    new_monitoring_dict = {
        'monitoring_type': 'radar',
        'official_gazette_link': str(monitoramento_data.link_diario),
        'edital_identifier': monitoramento_data.id_edital,
        'candidate_name': None,
        'keywords': monitoramento_data.id_edital,
        'last_checked_at': firestore.SERVER_TIMESTAMP,
        'last_pdf_hash': None,
        'occurrences': 0,
        'status': 'active',
        'created_at': firestore.SERVER_TIMESTAMP,
        'user_uid': user_uid,
        'user_email': user_email
    }
    
    # Documento principal
    _, doc_ref = db_firestore_client.collection('monitorings').add(new_monitoring_dict)

    # Ocorrência inicial
    try:
        doc_ref.collection("occurrences").add({
            "edital_identifier": monitoramento_data.id_edital,
            "official_gazette_link": str(monitoramento_data.link_diario),
            "pdf_real_link": str(monitoramento_data.link_diario),
            "last_pdf_hash": None,
            "detected_at": firestore.SERVER_TIMESTAMP,
            "last_checked_at": firestore.SERVER_TIMESTAMP,
        })
        doc_ref.update({"occurrences": 1})
    except Exception as e:
        print("Erro criando ocorrência inicial:", e)

    new_monitoring_obj = Monitoring(
        id=doc_ref.id,
        **{**new_monitoring_dict, 'last_checked_at': datetime.now(), 'created_at': datetime.now()}
    )

    # 📧 Envio de e-mail
    background_tasks.add_task(
        send_email_notification,
        monitoramento=new_monitoring_obj,
        template_type='monitoring_active',
        to_email=new_monitoring_obj.user_email
    )

    # Primeira checagem
    background_tasks.add_task(perform_monitoring_check, new_monitoring_obj)

    # 📲 Envio de WhatsApp via UltraMSG (Somente Premium)
    asyncio.create_task(send_whatsapp_notification(new_monitoring_obj, user_plan_for_creation))


    print(f"Novo Monitoramento Radar criado para UID {user_uid}: {new_monitoring_obj.dict()}")
    return new_monitoring_obj

@app.post("/api/create-preference")
async def create_preference(
    request_data: CreatePreferenceRequest,
    user_uid: str = Depends(get_current_user_uid)
):
    plans_details = {
        "premium_plan": {
            "title": "Plano Premium Conecta Edital",
            "unit_price": 39.90,
            "quantity": 1,
            "description": "Acesso ilimitado a todos os recursos de monitoramento."
        },
        "essencial_plan": {
            "title": "Plano Essencial Conecta Edital",
            "unit_price": 19.90,
            "quantity": 1,
            "description": "Acesso a recursos essenciais de monitoramento."
        }
    }

    plan_info = plans_details.get(request_data.plan_id)

    if not plan_info:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")

    YOUR_FRONTEND_BASE_URL = "https://siteconectaedital.netlify.app"
    YOUR_BACKEND_BASE_URL = "https://conecta-edital-site-927y.onrender.com"

    notification_url = f"{YOUR_BACKEND_BASE_URL}/webhook/mercadopago"

    try:
        checkout_url = create_mercadopago_checkout_url(
            plan_id=request_data.plan_id,
            preapproval_plan_ids=PREAPPROVAL_PLAN_IDS
        )
        if not checkout_url:
            raise HTTPException(status_code=500, detail="Erro ao criar preferência de pagamento com Mercado Pago.")
        
        return {"checkout_url": checkout_url}
    
    except Exception as e:
        print(f"ERRO GERAL ao criar preferência de pagamento: {e}")
        raise HTTPException(status_code=500, detail=f"Erro geral ao criar preferência de pagamento: {e}")

@app.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    print("\n--- Webhook do Mercado Pago recebido ---")
    
    try:
        topic = request.query_params.get("topic")
        payment_id = request.query_params.get("id")
        
        if topic not in ["payment", "merchant_order"]:
            print(f"Webhook: Tópico de notificação '{topic}' não relevante. Ignorando.")
            return {"status": "ignored"}, status.HTTP_200_OK
            
        if not payment_id:
            print("ERRO no webhook: 'id' da transação não encontrado nos parâmetros.")
            return {"status": "error"}, status.HTTP_400_BAD_REQUEST

        payment_info = await asyncio.to_thread(sdk.payment().get, payment_id)

        if payment_info["status"] != 200:
            print(f"ERRO no webhook: Falha ao buscar detalhes do pagamento. Status: {payment_info['status']}")
            return {"status": "error"}, status.HTTP_500_INTERNAL_SERVER_ERROR

        payment_data = payment_info["response"]
        status_pagamento = payment_data.get("status")
        external_reference = payment_data.get("external_reference")

        if not external_reference:
            print("ERRO no webhook: 'external_reference' não encontrado.")
            return {"status": "error"}, status.HTTP_400_BAD_REQUEST

        parts = external_reference.split("_PLAN-")
        if len(parts) != 2:
            print("ERRO no webhook: Formato inválido de external_reference.")
            return {"status": "error"}, status.HTTP_400_BAD_REQUEST

        user_id = parts[0].replace("USER-", "")
        plan_id = parts[1]

        # Converter internal plan
        internal_plan_type = {
            "premium_plan": "premium",
            "essencial_plan": "essencial"
        }.get(plan_id)

        if not internal_plan_type:
            print(f"ERRO no webhook: plan_id desconhecido: {plan_id}")
            return {"status": "error"}, status.HTTP_400_BAD_REQUEST

        db = firestore.client()
        user_doc_ref = db.collection("users").document(user_id)

        # ---------------------------------------------------
        # PAGAMENTO APROVADO
        # ---------------------------------------------------
        if status_pagamento == "approved":
            print(f"Webhook: Pagamento APROVADO para usuário {user_id}, plano {internal_plan_type}.")
            user_doc_ref.update({"plan_type": internal_plan_type})

            # Buscar telefone
            user_doc = user_doc_ref.get()
            user_data = user_doc.to_dict()
            user_phone = user_data.get("contact")

            if user_phone:
                whatsapp_message = (
                    f"🎉 *Plano {internal_plan_type.capitalize()} Ativado!*\n\n"
                    "Seu pagamento foi aprovado e seu plano está ativo!\n\n"
                    "Agora você possui acesso liberado às funcionalidades premium 🚀\n\n"
                    "Obrigado por utilizar o Conecta Edital ❤️"
                )

                send_whatsapp_zapi(user_phone, whatsapp_message)
                print(f"📲 WhatsApp enviado para {user_phone}")
            else:
                print(f"⚠️ Usuário {user_id} não tem número salvo.")

            return {"status": "ok"}, status.HTTP_200_OK

        # ---------------------------------------------------
        # REJEITADO / PENDENTE / OUTROS
        # ---------------------------------------------------
        if status_pagamento == "rejected":
            print(f"Pagamento REJEITADO para {user_id}.")
            return {"status": "ok"}, status.HTTP_200_OK

        if status_pagamento == "pending":
            print(f"Pagamento PENDENTE para {user_id}.")
            return {"status": "ok"}, status.HTTP_200_OK

        print(f"Status desconhecido no webhook: {status_pagamento}")
        return {"status": "ignored"}, status.HTTP_200_OK

    except Exception as e:
        print(f"ERRO no Webhook: {e}")
        return {"status": "error", "message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR

@app.get("/api/status")
async def get_status(user_uid: str = Depends(get_current_user_uid)):
    db_firestore_client = firestore.client()

    # 🔹 Busca o documento do usuário
    user_ref = db_firestore_client.collection('users').document(user_uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    user_data = user_doc.to_dict()

    # 🔹 Usa função unificada (garante consistência)
    user_plan = await get_user_plan_from_firestore(user_uid)
    slots_personalizados = user_data.get("custom_slots") or user_data.get("slots_disponiveis")

    # 🔹 Busca monitoramentos
    monitoramentos_ref = db_firestore_client.collection("monitorings").where("user_uid", "==", user_uid)
    monitoramentos = list(monitoramentos_ref.stream())

    total_monitoramentos = len(monitoramentos)
    monitoramentos_ativos = len([m for m in monitoramentos if m.to_dict().get("status") == "active"])

    # 🔹 Nome amigável
    display_plan_name = {
        "sem_plano": "Sem Plano",
        "gratuito": "Sem Plano",
        "basico": "Plano Básico",
        "essencial": "Plano Essencial",
        "premium": "Plano Premium"
    }.get(user_plan, "Sem Plano")

    # 🔹 Calcula slots disponíveis
    if slots_personalizados is not None:
        slots_livres = max(0, slots_personalizados - total_monitoramentos)
    elif user_plan == "premium":
        slots_livres = "Ilimitado"
    elif user_plan == "essencial":
        slots_livres = max(0, 3 - total_monitoramentos)
    elif user_plan == "basico":
        slots_livres = max(0, 5 - total_monitoramentos)
    else:
        slots_livres = 0

    return {
        "status": "ok",
        "user_plan": display_plan_name,
        "total_monitoramentos": total_monitoramentos,
        "monitoramentos_ativos": monitoramentos_ativos,
        "slots_livres": slots_livres
    }


@app.delete("/api/monitoramentos/{monitoring_id}", status_code=204)
async def delete_monitoring_endpoint(
    monitoring_id: str,
    user_uid: str = Depends(get_current_user_uid)
):
    db_firestore_client = firestore.client()
    doc_ref = db_firestore_client.collection('monitorings').document(monitoring_id)
    doc = doc_ref.get()

    if not doc.exists or doc.to_dict().get('user_uid') != user_uid:
        raise HTTPException(status_code=404, detail="Monitoramento não encontrado ou você não tem permissão para excluí-lo.")

    doc_ref.delete()
    print(f"Monitoramento {monitoring_id} deletado para o usuário {user_uid}")
    return

@app.patch("/api/monitoramentos/{monitoring_id}/status")
async def update_monitoring_status(
    monitoring_id: str,
    active: dict,
    user_uid: str = Depends(get_current_user_uid)
):
    is_active = active.get("active")
    if not isinstance(is_active, bool):
        raise HTTPException(status_code=400, detail="O campo 'active' deve ser um booleano.")

    db_firestore_client = firestore.client()
    doc_ref = db_firestore_client.collection('monitorings').document(monitoring_id)
    doc = doc_ref.get()

    if not doc.exists or doc.to_dict().get('user_uid') != user_uid:
        raise HTTPException(status_code=404, detail="Monitoramento não encontrado ou você não tem permissão para alterá-lo.")

    new_status = "active" if is_active else "inactive"
    doc_ref.update({'status': new_status})
    print(f"Status do monitoramento {monitoring_id} alterado para {new_status}")
    return {"message": "Status do monitoramento atualizado com sucesso."}

@app.post("/api/test-monitoring")
async def test_monitoring_endpoint(
    pdf_file: UploadFile = File(...),
    keyword: str = Form(...),
    email: EmailStr = Form(...)
):
    db_firestore_client = firestore.client()
    
    test_email_ref = db_firestore_client.collection('test_monitorings').document(email)
    test_email_doc = test_email_ref.get()
    
    if test_email_doc.exists:
        raise HTTPException(status_code=400, detail="Este e-mail já foi utilizado para um teste. Por favor, use um e-mail diferente para o teste gratuito.")

    try:
        pdf_content = await pdf_file.read()
        pdf_text = await extract_text_from_pdf(pdf_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o PDF: {e}")

    found = keyword.lower() in pdf_text.lower()
    
    temp_monitoring = Monitoring(
        id="teste-temporario",
        monitoring_type="teste",
        official_gazette_link=HttpUrl("http://teste.conectaedital.com/diario.pdf"),
        edital_identifier=f"Teste: {keyword}",
        candidate_name=None,
        cpf=None,
        keywords=keyword,
        last_checked_at=datetime.now(),
        last_pdf_hash="teste",
        occurrences=1 if found else 0,
        status="active",
        created_at=datetime.now(),
        user_uid="teste_user_uid",
        user_email=email
    )
    
    send_email_notification(
        monitoramento=temp_monitoring,
        template_type='occurrence_found',
        to_email=email,
        found_keywords=[keyword] if found else None
    )

    

    test_email_ref.set({
        "email": email,
        "keyword": keyword,
        "created_at": firestore.SERVER_TIMESTAMP
    })

    if found:
        return {"message": "Palavra-chave encontrada! O resultado foi enviado para o seu e-mail."}
    else:
        return {"message": "Palavra-chave não encontrada. Verifique se a palavra está correta ou tente outro PDF."}

# ========================================================================================================
#       ROTAS DE SUPORTE
# ========================================================================================================

@app.get("/api/tickets", response_model=List[Ticket])
async def list_user_tickets(user_uid: str = Depends(get_current_user_uid)):
    db = firestore.client()
    tickets_ref = db.collection('tickets').where(filter=FieldFilter('user_uid', '==', user_uid)).order_by('last_updated_at', direction=firestore.Query.DESCENDING)
    
    tickets_list = []
    for doc in tickets_ref.stream():
        ticket_data = doc.to_dict()
        
        # Converte o timestamp do Firestore para o formato ISO
        if 'created_at' in ticket_data and ticket_data['created_at']:
            ticket_data['created_at'] = ticket_data['created_at'].isoformat()
        if 'last_updated_at' in ticket_data and ticket_data['last_updated_at']:
            ticket_data['last_updated_at'] = ticket_data['last_updated_at'].isoformat()
        
        if 'messages' in ticket_data and isinstance(ticket_data['messages'], list):
            for message in ticket_data['messages']:
                if isinstance(message.get('timestamp'), datetime):
                    message['timestamp'] = message['timestamp'].isoformat()

        # Adiciona o campo 'category' com um valor padrão para tickets antigos, se necessário
                # Adiciona o campo 'category' com um valor padrão para tickets antigos, se necessário
        if 'category' not in ticket_data:
            ticket_data['category'] = 'Outros'

        # Garante que o campo 'assignee' sempre exista
        if 'assignee' not in ticket_data or not ticket_data['assignee']:
            ticket_data['assignee'] = 'Não Atribuído'


        tickets_list.append(Ticket(id=doc.id, **ticket_data))

    return tickets_list

# --- FUNÇÃO PARA GERAR ID DO TICKET ---
def generate_ticket_id() -> str:
    """Gera um ID de ticket de 6 caracteres com letras maiúsculas e números."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(6))
    
@app.post("/api/tickets", status_code=201)
async def create_ticket(
    new_ticket: NewTicket,
    user_uid: str = Depends(get_current_user_uid)
):
    db = firestore.client()
    user_email = await get_user_email_from_firestore(user_uid)

    if not user_email:
        raise HTTPException(status_code=404, detail="E-mail do usuário não encontrado.")
    
    # Geração do ID com 6 caracteres, com verificação de unicidade
    new_ticket_id = generate_ticket_id()
    while db.collection('tickets').document(new_ticket_id).get().exists:
        new_ticket_id = generate_ticket_id()

    now = datetime.now(timezone.utc)
    initial_message_data = {
        "sender": "user",
        "text": new_ticket.initial_message,
        "timestamp": now,
        "attachments": [] # Campo de anexo vazio
    }

    ticket_data = {
        "user_uid": user_uid,
        "user_email": user_email,
        "subject": new_ticket.subject,
        "category": new_ticket.category, # NOVO CAMPO ADICIONADO AQUI
        "status": "Pendente",
        "created_at": firestore.SERVER_TIMESTAMP,
        "last_updated_at": firestore.SERVER_TIMESTAMP,
        "assignee": "Não Atribuído",
        "messages": [initial_message_data]
    }
    
    # Cria o documento com o ID gerado
    doc_ref = db.collection('tickets').document(new_ticket_id)
    doc_ref.set(ticket_data)
    
    ticket_doc = doc_ref.get().to_dict()
    ticket_doc['id'] = doc_ref.id
    
    return Ticket(**ticket_doc)


@app.post("/api/tickets/{ticket_id}/reply")
async def user_reply_to_ticket(
    ticket_id: str,
    reply: UserReply,
    user_uid: str = Depends(get_current_user_uid)
):
    db = firestore.client()
    ref = db.collection('tickets').document(ticket_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    if doc.to_dict().get('user_uid') != user_uid:
        raise HTTPException(status_code=403, detail="Você não tem permissão para responder a este ticket.")

    now = datetime.now(timezone.utc)
    new_message = {
        "sender": "user",
        "text": reply.text,
        "timestamp": now,
        "attachments": [] # Campo de anexo vazio
    }

    ref.update({
        'messages': firestore.ArrayUnion([new_message]),
        'status': 'Em Andamento',
        'last_updated_at': firestore.SERVER_TIMESTAMP
    })
    
    await create_notification(
    user_uid=ticket_data.get("user_uid"),
    type_="resposta_suporte",
    title="Nova resposta do suporte",
    message=f"O suporte respondeu ao seu ticket {ticket_id}.",
    link=f"/suporte?ticket={ticket_id}"
)

    updated_ticket_data = ref.get().to_dict()
    return {"message": "Resposta enviada", "ticket": updated_ticket_data}



@app.patch("/admin/tickets/{ticket_id}/assign")
async def assign_ticket_to_admin(ticket_id: str, data: dict = Body(...)):
    """
    Atribui um ticket a um administrador (campo assignee).
    Exemplo de body esperado: {"assignee": "gabriel"}
    """
    db = firestore.client()
    assignee = data.get("assignee")

    if not assignee:
        raise HTTPException(status_code=400, detail="Campo 'assignee' é obrigatório.")

    ticket_ref = db.collection("tickets").document(ticket_id)
    doc = ticket_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    ticket_ref.update({
        "assignee": assignee,
        "last_updated_at": firestore.SERVER_TIMESTAMP
    })

    updated_ticket = ticket_ref.get().to_dict()

    return {
        "message": f"Ticket {ticket_id} atribuído a {assignee} com sucesso!",
        "ticket": updated_ticket
    }
# Ao o admin responder


# --- ROTA PARA OBTER DADOS DE UM USUÁRIO ESPECÍFICO ---

# ========================================================================================================
# --- ROTA CORRIGIDA PARA ATUALIZAR O PERFIL DO USUÁRIO ---
# ========================================================================================================
# ================================================================================================
#       ROTAS DE SUPORTE PARA O PAINEL DE ADMIN
# ========================================================================================================

@app.get("/admin/tickets")
async def list_all_tickets():
    """Retorna todos os tickets, ordenados do mais recente para o mais antigo."""
    db = firestore.client()
    tickets_ref = db.collection('tickets').order_by('last_updated_at', direction=firestore.Query.DESCENDING)
    
    tickets_list = []
    for doc in tickets_ref.stream():
        ticket_data = doc.to_dict()

        # Converte timestamps Firestore → string
        if isinstance(ticket_data.get('created_at'), datetime):
            ticket_data['created_at'] = ticket_data['created_at'].isoformat()
        if isinstance(ticket_data.get('last_updated_at'), datetime):
            ticket_data['last_updated_at'] = ticket_data['last_updated_at'].isoformat()

        if 'messages' in ticket_data and isinstance(ticket_data['messages'], list):
            for message in ticket_data['messages']:
                if isinstance(message.get('timestamp'), datetime):
                    message['timestamp'] = message['timestamp'].isoformat()

        # ✅ Garante campos padrão mesmo que não existam no Firestore
        ticket_data.setdefault('category', 'Outros')
        ticket_data.setdefault('assignee', 'Não Atribuído')

        tickets_list.append(Ticket(id=doc.id, **ticket_data))

    return tickets_list


@app.post("/admin/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(ticket_id: str, reply: AdminReply):
    db = firestore.client()
    ticket_doc_ref = db.collection('tickets').document(ticket_id)
    ticket_doc = ticket_doc_ref.get()

    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    ticket_data = ticket_doc.to_dict()
    user_uid = ticket_data.get("user_uid")

    now = datetime.now(timezone.utc)
    new_message = {
        "sender": "admin",
        "text": reply.text,
        "timestamp": now,
        "attachments": []
    }

    ticket_doc_ref.update({
        "messages": firestore.ArrayUnion([new_message]),
        "status": "Em andamento",
        "last_updated_at": firestore.SERVER_TIMESTAMP
    })

    # 🔔 Envia notificação para o usuário
    await create_notification(
        user_uid=user_uid,
        type_="resposta_suporte",
        title="Nova resposta do suporte 💬",
        message=f"O suporte respondeu ao seu ticket {ticket_id}.",
        link=f"/suporte?ticket={ticket_id}"
    )

    print(f"✅ Notificação enviada para o usuário {user_uid} sobre resposta no ticket {ticket_id}.")
    updated_ticket_data = ticket_doc_ref.get().to_dict()

    return {
        "message": "Resposta do admin enviada com sucesso!",
        "ticket": updated_ticket_data
    }


# Ao o admin responder



@app.patch("/admin/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status_update: TicketStatusUpdate,
):
    db = firestore.client()
    ticket_doc_ref = db.collection('tickets').document(ticket_id)

    if not ticket_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    ticket_doc_ref.update({'status': status_update.status, 'last_updated_at': firestore.SERVER_TIMESTAMP})
    return {"message": f"Status do ticket {ticket_id} atualizado para '{status_update.status}'."}

# Rota para o administrador ver todas as estatísticas
@app.get("/admin/stats")
async def get_admin_stats():
    db = firestore.client()
    users_ref = db.collection('users')
    monitorings_ref = db.collection('monitorings')

    all_users = list(users_ref.stream())
    total_users = len(all_users)
    all_monitorings = list(monitorings_ref.stream())

    plan_distribution = {
        'gratuito': {'count': 0, 'slots_used': 0},
        'essencial': {'count': 0, 'slots_used': 0},
        'premium': {'count': 0, 'slots_used': 0}
    }
    slot_distribution = {
        'zero_slots': {'count': 0},
        'one_two_slots': {'count': 0},
        'three_five_slots': {'count': 0},
        'six_plus_slots': {'count': 0}
    }

    monitorings_by_user = defaultdict(int)
    for mon_doc in all_monitorings:
        mon_data = mon_doc.to_dict()
        user_uid = mon_data.get('user_uid')
        if user_uid:
            monitorings_by_user[user_uid] += 1
    
    active_users_count = 0
    inactive_users_count = 0
    
    for user_doc in all_users:
        user_uid = user_doc.id
        user_data = user_doc.to_dict()
        user_plan = user_data.get('plan_type', 'gratuito')
        
        num_monitorings = monitorings_by_user.get(user_uid, 0)
        if num_monitorings > 0:
            active_users_count += 1
        else:
            inactive_users_count += 1
            
        if user_plan in plan_distribution:
            plan_distribution[user_plan]['count'] += 1

        if num_monitorings == 0:
            slot_distribution['zero_slots']['count'] += 1
        elif num_monitorings <= 2:
            slot_distribution['one_two_slots']['count'] += 1
        elif num_monitorings <= 5:
            slot_distribution['three_five_slots']['count'] += 1
        else:
            slot_distribution['six_plus_slots']['count'] += 1

    for plan_key in plan_distribution:
        if total_users > 0:
            plan_distribution[plan_key]['percentage'] = (plan_distribution[plan_key]['count'] / total_users) * 100
        else:
            plan_distribution[plan_key]['percentage'] = 0

    total_slot_users = sum(s['count'] for s in slot_distribution.values())
    for slot_key in slot_distribution:
        if total_slot_users > 0:
            slot_distribution[slot_key]['percentage'] = (slot_distribution[slot_key]['count'] / total_slot_users) * 100
        else:
            slot_distribution[slot_key]['percentage'] = 0
            
    user_status_distribution = {
        'active': {'count': active_users_count, 'percentage': 0},
        'inactive': {'count': inactive_users_count, 'percentage': 0}
    }
    if total_users > 0:
        user_status_distribution['active']['percentage'] = (active_users_count / total_users) * 100
        user_status_distribution['inactive']['percentage'] = (inactive_users_count / total_users) * 100

    return {
        "total_users": total_users,
        "plan_distribution": {
            "no_plan": plan_distribution['gratuito'],
            "essencial": plan_distribution['essencial'],
            "premium": plan_distribution['premium']
        },
        "slot_distribution": {
            "zero_slots": slot_distribution['zero_slots'],
            "one_two_slots": slot_distribution['one_two_slots'],
            "three_five_slots": slot_distribution['three_five_slots'],
            "six_plus_slots": slot_distribution['six_plus_slots']
        },
        "user_status_distribution": user_status_distribution
    }

@app.get("/admin/users")
async def get_all_users_for_audit():
    """
    Retorna uma lista simplificada de todos os usuários para auditoria.
    """
    db = firestore.client()
    users_stream = db.collection('users').stream()
    
    users_list = []
    for doc in users_stream:
        user_data = doc.to_dict()
        users_list.append({
            "uid": doc.id,
            "email": user_data.get("email", "N/A"),
            "plan_type": user_data.get("plan_type", "gratuito"),
            "full_name": user_data.get("fullName", "N/A"),
            "status": user_data.get("status", "ativo")
        })
        
    return users_list

# NOVO ENDPOINT DE ADMIN

@app.get("/admin/feedback_stats")
async def get_admin_feedback_stats():
    db = firestore.client()
    tickets_ref = db.collection('tickets')
    users_ref = db.collection('users')
    
    all_tickets = list(tickets_ref.stream())
    total_tickets = len(all_tickets)
    
    # Estatísticas de Tickets
    tickets_by_status = defaultdict(int)
    tickets_by_category = defaultdict(int)
    tickets_by_month = defaultdict(int)
    total_resolved_time = 0
    resolved_tickets_count = 0
    pending_tickets_count = 0
    
    for ticket in all_tickets:
        ticket_data = ticket.to_dict()
        status = ticket_data.get('status', 'Desconhecido')
        category = ticket_data.get('category', 'Outros')
        created_at = ticket_data.get('created_at')

        tickets_by_status[status] += 1
        tickets_by_category[category] += 1

        # Tempo médio de resolução
        if status == 'Finalizado':
            last_updated_at = ticket_data.get('last_updated_at')
            if created_at and last_updated_at:
                resolved_time = (last_updated_at - created_at).total_seconds()
                total_resolved_time += resolved_time
            resolved_tickets_count += 1

        # Contagem de pendentes
        if status in ['Pendente', 'Em Andamento']:
            pending_tickets_count += 1

        # Agrupamento mensal
        if created_at:
            month_year = created_at.strftime('%b. %y')
            tickets_by_month[month_year] += 1

    # Cálculos gerais
    avg_resolution_time_hours = (
        (total_resolved_time / resolved_tickets_count / 3600)
        if resolved_tickets_count > 0 else 0
    )

    response_rate = (
        (tickets_by_status.get('Respondido', 0) + tickets_by_status.get('Resolvido', 0))
        / total_tickets * 100 if total_tickets > 0 else 0
    )

    # Distribuição de Status
    ticket_status_distribution = {}
    for status, count in tickets_by_status.items():
        percentage = (count / total_tickets) * 100 if total_tickets > 0 else 0
        ticket_status_distribution[status] = {'count': count, 'percentage': percentage}

    # Distribuição de Categorias
    tickets_by_category_list = [
        {'category': cat, 'count': count} for cat, count in tickets_by_category.items()
    ]

    # Tendência Mensal (últimos 7 meses)
    now = datetime.now()
    monthly_trend = []
    for i in range(6, -1, -1):
        month_ago = now - relativedelta(months=i)
        month_year_label = month_ago.strftime('%b. %y')
        monthly_trend.append({
            'month': month_year_label,
            'count': tickets_by_month.get(month_year_label, 0)
        })

    # Usuários Mais Ativos
    tickets_by_user = defaultdict(int)
    for ticket in all_tickets:
        user_uid = ticket.to_dict().get('user_uid')
        if user_uid:
            tickets_by_user[user_uid] += 1

    most_active_users = []
    users_with_tickets = [
        uid for uid, count in sorted(
            tickets_by_user.items(), key=lambda item: item[1], reverse=True
        )[:5]
    ]

    if users_with_tickets:
        docs = users_ref.stream()
        user_data_map = {doc.id: doc.to_dict() for doc in docs if doc.id in users_with_tickets}

        for uid in users_with_tickets:
            user_data = user_data_map.get(uid, {})
            user_name = user_data.get('fullName', 'Usuário Desconhecido')
            user_email = user_data.get('email', 'email@desconhecido.com')
            most_active_users.append({
                'name': user_name,
                'email': user_email,
                'ticket_count': tickets_by_user[uid]
            })

    # Contagem de usuários
    all_users_count = len(list(users_ref.stream()))
    active_users_count = len(list(users_ref.where(filter=FieldFilter('status', '==', 'ativo')).stream()))

    # ✅ Retorno final compatível com o front-end
    return {
        "total_tickets": total_tickets,
        "response_rate": response_rate,
        "avg_resolution_time_hours": avg_resolution_time_hours,
        "pending_tickets": pending_tickets_count,
        "ticket_status_distribution": ticket_status_distribution,
        "tickets_by_category": tickets_by_category_list,
        "monthly_trend": monthly_trend,
        "most_active_users": most_active_users,
        "total_users": all_users_count,
        "active_users": active_users_count
    }

# ========================================================================================================
#       ROTAS PARA DICAS
# ========================================================================================================
# ========================================================================================================
#       ROTA PARA CRIAR DICAS (com notificação automática para todos os usuários)
# ========================================================================================================
@app.post("/dicas", response_model=Dica, status_code=201)
async def create_dica(dica: Dica):
    """
    Cria uma nova dica e envia notificações para todos os usuários.
    """
    db = firestore.client()
    dica_dict = dica.dict(exclude_unset=True)
    dica_dict['data_criacao'] = firestore.SERVER_TIMESTAMP

    # Adiciona a dica no Firestore
    _, doc_ref = db.collection('dicas').add(dica_dict)
    new_doc = doc_ref.get()

    if not new_doc.exists:
        raise HTTPException(status_code=500, detail="Erro ao buscar o documento recém-criado.")

    new_dica = Dica(id=new_doc.id, **new_doc.to_dict())

    # Envia notificação para todos os usuários
    users = db.collection("users").stream()
    for user in users:
        await create_notification(
            user_uid=user.id,
            type_="nova_dica",
            title="Nova Dica disponível 💡",
            message=f"{dica.titulo}",
            link="/dicas"
        )
        print(f"✅ Notificação enviada para {user.id}")

    return new_dica


@app.get("/dicas", response_model=List[Dica])
async def list_dicas():
    db = firestore.client()
    dicas_ref = db.collection('dicas').order_by('data_criacao', direction=firestore.Query.DESCENDING)
    dicas_list = []
    for doc in dicas_ref.stream():
        dicas_list.append(Dica(id=doc.id, **doc.to_dict()))
    return dicas_list

@app.get("/dicas/{dica_id}", response_model=Dica)
async def get_dica(dica_id: str):
    db = firestore.client()
    dica_doc_ref = db.collection('dicas').document(dica_id)
    dica_doc = dica_doc_ref.get()
    if not dica_doc.exists:
        raise HTTPException(status_code=404, detail="Dica não encontrada")

    dica_doc_ref.update({'visualizacoes': firestore.Increment(1)})
    
    return Dica(id=dica_doc.id, **dica_doc.to_dict())

@app.put("/dicas/{dica_id}", response_model=Dica)
async def update_dica(dica_id: str, updated_dica: Dica):
    db = firestore.client()
    dica_doc_ref = db.collection('dicas').document(dica_id)
    if not dica_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Dica não encontrada")

    dica_doc_ref.update(updated_dica.dict(exclude_unset=True, exclude={'id', 'data_criacao'}))
    updated_doc = dica_doc_ref.get()
    return Dica(id=updated_doc.id, **updated_doc.to_dict())

@app.delete("/dicas/{dica_id}", status_code=204)
async def delete_dica(dica_id: str):
    db = firestore.client()
    dica_doc_ref = db.collection('dicas').document(dica_id)
    if not dica_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Dica não encontrada")
    
    dica_doc_ref.delete()
    return

@app.post("/dicas/{dica_id}/visualizacao")
async def record_dica_view(dica_id: str):
    db = firestore.client()
    dica_doc_ref = db.collection('dicas').document(dica_id)
    dica_doc = dica_doc_ref.get()
    
    if not dica_doc.exists:
        raise HTTPException(status_code=404, detail="Dica não encontrada")
    
    dica_doc_ref.update({'visualizacoes': firestore.Increment(1)})
    return {"message": "Visualização registrada com sucesso."}

# ========================================================================================================
#       ROTAS PARA ARTIGOS DO BLOG
# ========================================================================================================
@app.post("/articles", response_model=Article, status_code=201)
async def create_article(article: Article):
    db = firestore.client()
    article_dict = article.dict(exclude_unset=True)
    article_dict['data_criacao'] = firestore.SERVER_TIMESTAMP

    # 🔹 Cria o artigo no Firestore
    _, doc_ref = db.collection('articles').add(article_dict)
    new_doc = doc_ref.get()

    # 🔹 Verifica se o documento foi criado com sucesso
    if new_doc.exists:
        new_article = Article(id=new_doc.id, **new_doc.to_dict())

        # 🔔 Envia notificação para todos os usuários
        users = db.collection("users").stream()
        for user in users:
            await create_notification(
                user_uid=user.id,
                type_="novo_artigo",
                title="📰 Novo artigo publicado!",
                message=f"{new_article.titulo}",
                link="/blog"
            )
            print(f"✅ Notificação enviada para {user.id}")

        return new_article

    # 🔹 Caso o documento não exista (erro no Firestore)
    else:
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar o documento recém-criado."
        )

@app.get("/articles", response_model=List[Article])
async def list_articles():
    db = firestore.client()
    articles_ref = db.collection('articles').order_by('data_criacao', direction=firestore.Query.DESCENDING)
    articles_list = []
    for doc in articles_ref.stream():
        articles_list.append(Article(id=doc.id, **doc.to_dict()))
    return articles_list

@app.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    db = firestore.client()
    article_doc_ref = db.collection('articles').document(article_id)
    article_doc = article_doc_ref.get()
    if not article_doc.exists:
        raise HTTPException(status_code=404, detail="Artigo não encontrado.")

    article_doc_ref.update({'visualizacoes': firestore.Increment(1)})
    return Article(id=article_doc.id, **article_doc.to_dict())

@app.put("/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, updated_article: Article):
    db = firestore.client()
    article_doc_ref = db.collection('articles').document(article_id)
    if not article_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Artigo não encontrado.")

    article_doc_ref.update(updated_article.dict(exclude_unset=True, exclude={'id', 'data_criacao'}))
    updated_doc = article_doc_ref.get()
    return Article(id=updated_doc.id, **updated_doc.to_dict())

@app.delete("/articles/{article_id}", status_code=204)
async def delete_article(article_id: str):
    db = firestore.client()
    article_doc_ref = db.collection('articles').document(article_id)
    if not article_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Artigo não encontrado.")
    
    article_doc_ref.delete()
    return

@app.post("/articles/{article_id}/visualizacao")
async def record_article_view(article_id: str):
    db = firestore.client()
    article_doc_ref = db.collection('articles').document(article_id)
    article_doc = article_doc_ref.get()
    if not article_doc.exists:
        raise HTTPException(status_code=404, detail="Artigo não encontrado.")
    
    article_doc_ref.update({'visualizacoes': firestore.Increment(1)})
    return {"message": "Visualização de artigo registrada com sucesso."}
    
# ========================================================================================================
#       ROTAS PARA FAQ
# ========================================================================================================
@app.post("/faq", response_model=FAQ, status_code=201)
async def create_faq(faq: FAQ):
    db = firestore.client()
    faq_dict = faq.dict(exclude_unset=True)
    
    # Use firestore.SERVER_TIMESTAMP para a data de criação
    faq_dict['data_criacao'] = firestore.SERVER_TIMESTAMP
    
    _, doc_ref = db.collection('faq').add(faq_dict)
    
    # Obtenha o documento recém-criado para ter a data real do servidor
    new_doc = doc_ref.get()
    
    if new_doc.exists:
        new_faq = FAQ(id=new_doc.id, **new_doc.to_dict())
        return new_faq
    else:
        raise HTTPException(status_code=500, detail="Erro ao buscar o documento recém-criado.")

@app.get("/faq", response_model=List[FAQ])
async def list_faqs():
    db = firestore.client()
    # CORREÇÃO AQUI: Ordena por `popular` e depois por `data_criacao` para exibir no topo.
    faqs_ref = db.collection('faq').order_by('popular', direction=firestore.Query.DESCENDING).order_by('data_criacao', direction=firestore.Query.DESCENDING)
    faqs_list = []
    for doc in faqs_ref.stream():
        faqs_list.append(FAQ(id=doc.id, **doc.to_dict()))
    return faqs_list

@app.put("/faq/{faq_id}", response_model=FAQ)
async def update_faq(faq_id: str, updated_faq: FAQ):
    db = firestore.client()
    faq_doc_ref = db.collection('faq').document(faq_id)
    if not faq_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="FAQ não encontrado")

    faq_doc_ref.update(updated_faq.dict(exclude_unset=True, exclude={'id', 'data_criacao'}))
    updated_doc = faq_doc_ref.get()
    return FAQ(id=updated_doc.id, **updated_doc.to_dict())

@app.delete("/faq/{faq_id}", status_code=204)
async def delete_faq(faq_id: str):
    db = firestore.client()
    faq_doc_ref = db.collection('faq').document(faq_id)
    if not faq_doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="FAQ não encontrado")
    
    faq_doc_ref.delete()
    return

@app.post("/faq/{faq_id}/visualizacao")
async def record_faq_view(faq_id: str):
    db = firestore.client()
    faq_doc_ref = db.collection('faq').document(faq_id)
    
    # Usamos uma transação para garantir que a leitura e a atualização sejam atômicas
    @firestore.transactional
    def update_in_transaction(transaction, doc_ref):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            raise HTTPException(status_code=404, detail="FAQ não encontrado")
        
        visualizacoes_atuais = snapshot.get('visualizacoes') or 0
        novas_visualizacoes = visualizacoes_atuais + 1
        transaction.update(doc_ref, {'visualizacoes': novas_visualizacoes})
        return novas_visualizacoes
    
    try:
        # Executa a transação
        transaction = db.transaction()
        novas_visualizacoes = update_in_transaction(transaction, faq_doc_ref)
        
        # Retorna o novo número de visualizações
        return {"visualizacoes": novas_visualizacoes}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO: Falha ao atualizar visualização do FAQ. Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")


# ========================================================================================================
#       ROTAS PARA FAQS POPULARES FIXAS
# ========================================================================================================
@app.post("/popular_faqs/{faq_id}/visualizacao")
async def record_popular_faq_view(faq_id: str):
    db = firestore.client()
    stats_doc_ref = db.collection('popular_faqs_stats').document(faq_id)
    
    @firestore.transactional
    def update_in_transaction(transaction, doc_ref):
        snapshot = doc_ref.get(transaction=transaction)
        
        visualizacoes_atuais = snapshot.get('visualizacoes') or 0
        novas_visualizacoes = visualizacoes_atuais + 1
        
        transaction.set(doc_ref, {'visualizacoes': novas_visualizacoes, 'last_updated': firestore.SERVER_TIMESTAMP})
        return novas_visualizacoes

    try:
        transaction = db.transaction()
        novas_visualizacoes = update_in_transaction(transaction, stats_doc_ref)
        return {"visualizacoes": novas_visualizacoes}
    
    except Exception as e:
        print(f"ERRO: Falha ao atualizar visualização do FAQ popular. Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# ========================================================================================================
#       NOVA ROTA PARA OBTER ESTATÍSTICAS
# ========================================================================================================
@app.get("/popular_faqs/stats")
async def get_popular_faqs_stats():
    db = firestore.client()
    stats_docs = db.collection('popular_faqs_stats').stream()
    stats = {}
    for doc in stats_docs:
        stats[doc.id] = doc.to_dict().get('visualizacoes', 0)
    return stats



@app.put("/api/monitoramentos/{monitoring_id}", response_model=Monitoring)
async def update_monitoring(
    monitoring_id: str,
    data: dict,
    user_uid: str = Depends(get_current_user_uid)
):
    """
    Atualiza os dados de um monitoramento (link, ID do edital, nome e keywords).
    O campo nome_completo só pode ser alterado em monitoramentos pessoais.
    """
    db = firestore.client()
    doc_ref = db.collection('monitorings').document(monitoring_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Monitoramento não encontrado.")

    mon_data = doc.to_dict()
    if mon_data.get("user_uid") != user_uid:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar este monitoramento.")

    updates = {}

    # Atualiza campos comuns
    if "link_diario" in data:
        updates["official_gazette_link"] = data["link_diario"]
    if "id_edital" in data:
        updates["edital_identifier"] = data["id_edital"]

    # Atualiza nome apenas se for tipo pessoal
    if mon_data.get("monitoring_type") == "personal" and "nome_completo" in data:
        updates["candidate_name"] = data["nome_completo"]

    # ✅ Atualiza keywords, se enviado
    if "keywords" in data and data["keywords"]:
        updates["keywords"] = data["keywords"]
    elif "palavras_chave" in data and data["palavras_chave"]:
        updates["keywords"] = data["palavras_chave"]

    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum dado válido fornecido para atualização.")

    updates["last_checked_at"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(updates)

    updated_doc = doc_ref.get().to_dict()
    return Monitoring(id=monitoring_id, **updated_doc)


@app.patch("/api/monitoramentos/{monitoring_id}")
async def patch_monitoring(
    monitoring_id: str,
    data: dict,
    user_uid: str = Depends(get_current_user_uid)
):
    """
    Atualiza campos específicos de um monitoramento — incluindo nome_customizado.
    """
    db = firestore.client()
    doc_ref = db.collection("monitorings").document(monitoring_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Monitoramento não encontrado.")

    mon_data = doc.to_dict()
    if mon_data.get("user_uid") != user_uid:
        raise HTTPException(status_code=403, detail="Sem permissão para editar este monitoramento.")

    updates = {}

    # 🔹 Permite atualizar o nome customizado do monitoramento (mas ignora strings vazias)
    if "nome_customizado" in data:
        nome_customizado = str(data["nome_customizado"]).strip()
        updates["nome_customizado"] = nome_customizado or None  # salva None se vazio


    # 🔹 (Opcional) também permite alterar o status, se enviado
    if "status" in data and data["status"] in ["active", "inactive"]:
        updates["status"] = data["status"]

    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo válido fornecido.")

    updates["last_checked_at"] = firestore.SERVER_TIMESTAMP
    doc_ref.update(updates)

    updated_doc = doc_ref.get().to_dict()
    return {"id": monitoring_id, **updated_doc}


from fastapi.responses import JSONResponse

@app.get("/api/monitoramentos")
async def list_monitoramentos(user_uid: str = Depends(get_current_user_uid)):
    """
    Retorna todos os monitoramentos do usuário autenticado,
    incluindo nome_customizado (se existir).
    """
    db = firestore.client()
    monitorings_ref = db.collection("monitorings").where("user_uid", "==", user_uid)
    docs = monitorings_ref.stream()

    monitoramentos = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id

        monitoramentos.append({
            "id": doc.id,
            "monitoring_type": data.get("monitoring_type"),
            "edital_identifier": data.get("edital_identifier"),
            "candidate_name": data.get("candidate_name"),
            "official_gazette_link": data.get("official_gazette_link"),
            "keywords": data.get("keywords", ""),
            "occurrences": data.get("occurrences", 0),
            "status": data.get("status", "inactive"),
            "last_checked_at": data.get("last_checked_at"),
            "user_uid": data.get("user_uid"),
            "user_email": data.get("user_email"),
            "nome_customizado": data.get("nome_customizado") if data.get("nome_customizado") is not None else "",
  # 👈 garante string
        })

    # 🔥 força a API a não ser cacheada (nem por Cloudflare nem por Render)
    return JSONResponse(content=monitoramentos, headers={"Cache-Control": "no-store, max-age=0"})



@app.get("/api/monitoramentos/{monitoramento_id}/historico")
async def get_monitoramento_historico(
    monitoramento_id: str,
    user_uid: str = Depends(get_current_user_uid)
):
    """
    Retorna o histórico completo de ocorrências de um monitoramento específico.
    Inclui o link do diário oficial e a data de cada ocorrência.
    """

    db = firestore.client()
    doc_ref = db.collection("monitorings").document(monitoramento_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Monitoramento não encontrado.")

    data = doc.to_dict()
    if data.get("user_uid") != user_uid:
        raise HTTPException(status_code=403, detail="Sem permissão para visualizar este monitoramento.")

    ocorrencias = []

    # 🔍 1️⃣ Tenta carregar subcoleção (caso exista)
    try:
        ocorrencias_ref = doc_ref.collection("occurrences")
        ocorrencias_docs = ocorrencias_ref.order_by("detected_at", direction=firestore.Query.DESCENDING).stream()
        for oc in ocorrencias_docs:
            odata = oc.to_dict()
            ocorrencias.append({
                "edital_identifier": odata.get("edital_identifier"),
                "pdf_real_link": odata.get("pdf_real_link"),
                "official_gazette_link": odata.get("official_gazette_link"),
                "link": odata.get("link"),
                "last_pdf_hash": odata.get("last_pdf_hash"),
                "detected_at": odata.get("detected_at"),
                "last_checked_at": odata.get("last_checked_at"),
            })
    except Exception as e:
        print(f"ℹ️ Nenhuma subcoleção encontrada: {e}")

    # 🔁 2️⃣ Se não houver subcoleção, cria ocorrência única com base no próprio documento
    if not ocorrencias:
        ocorrencias.append({
            "edital_identifier": data.get("edital_identifier"),
            "pdf_real_link": data.get("pdf_real_link"),
            "official_gazette_link": data.get("official_gazette_link"),
            "link": data.get("link"),
            "last_pdf_hash": data.get("last_pdf_hash"),
            "detected_at": data.get("last_checked_at"),
            "last_checked_at": data.get("last_checked_at"),
        })

    return {
        "monitoramento_id": monitoramento_id,
        "edital_identifier": data.get("edital_identifier"),
        "monitoring_type": data.get("monitoring_type"),
        "occurrences": len(ocorrencias),
        "data": ocorrencias,  # 👈 lista de ocorrências visível no histórico.js
    }


from fastapi import Body



@app.get("/api/users/{user_uid}", response_model=UserData)
async def get_user_data(user_uid: str, current_user_uid: str = Depends(get_current_user_uid)):
    """
    Retorna os dados do perfil do usuário autenticado.
    A dependência `current_user_uid` garante que o usuário só pode acessar
    os próprios dados, e não os de outros.
    """
    if user_uid != current_user_uid:
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para acessar os dados de outro usuário."
        )

    db = firestore.client()
    user_doc_ref = db.collection('users').document(user_uid)
    user_doc = user_doc_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Dados do usuário não encontrados.")
    
    user_data = user_doc.to_dict()
    
    # Adiciona valores padrão caso as chaves não existam
    user_data['fullName'] = user_data.get('fullName', 'Nome não informado')
    user_data['username'] = user_data.get('username', 'Usuário não informado')
    user_data['email'] = user_data.get('email', 'E-mail não informado')
    user_data['plan_type'] = user_data.get('plan_type', 'Sem Plano')
    user_data['photoURL'] = user_data.get('photoURL', None)
    user_data['contact'] = user_data.get('contact', None)

    # 🔹 Garante que o campo de slots exista e use o valor salvo ou o padrão do plano
    default_slots = {"gratuito": 1, "essencial": 3, "premium": 10}
    plan = user_data.get("plan_type", "gratuito")
    user_data["slots"] = user_data.get("slots", default_slots.get(plan, 1))

    return UserData(**user_data)


@app.patch("/api/users/{user_uid}", response_model=UserData)
async def update_user_profile(
    user_uid: str,
    update_data: UserProfileUpdate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Atualiza o perfil do usuário logado no Firestore.
    A dependência `current_user_uid` garante que o usuário só pode acessar
    e editar os próprios dados, e não os de outros.
    """
    if user_uid != current_user_uid:
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para editar os dados de outro usuário."
        )

    db = firestore.client()
    user_doc_ref = db.collection('users').document(current_user_uid)
    
    update_payload = update_data.model_dump(exclude_unset=True)
    
    if update_payload:
        user_doc_ref.update(update_payload)
        
        updated_doc = user_doc_ref.get()
        updated_data = updated_doc.to_dict()
        if updated_data:
            updated_data['id'] = updated_doc.id
        return UserData(**updated_data)
    
    return await get_user_data(user_uid, current_user_uid)


@app.patch("/admin/users/{user_uid}")
async def admin_update_user_profile(
    user_uid: str,
    update_data: AdminProfileUpdate,
):
    """
    Permite que um administrador atualize os dados de perfil de qualquer usuário.
    """
    db = firestore.client()
    user_doc_ref = db.collection('users').document(user_uid)
    user_doc = user_doc_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Dados do usuário não encontrados.")
    
    update_payload = update_data.dict(exclude_unset=True)
    if not update_payload:
        return {"message": "Nenhum dado fornecido para atualização."}

    try:
        if 'email' in update_payload and update_payload['email'] != user_doc.to_dict().get('email'):
            auth.update_user(user_uid, email=update_payload['email'])
        
        user_doc_ref.update(update_payload)
        print(f"Admin atualizou o perfil do usuário {user_uid}.")
        
        updated_doc = user_doc_ref.get().to_dict()
        return {"message": "Perfil atualizado com sucesso!", "user": updated_doc}

    except FirebaseError as e:
        print(f"ERRO: Erro no Firebase ao atualizar usuário: {e}")
        raise HTTPException(status_code=400, detail=f"Erro no Firebase: {e}")
    except Exception as e:
        print(f"ERRO: Erro inesperado ao atualizar perfil do usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")


# 🔹 Mantemos apenas UMA rota de slots corrigida e funcional
@app.put("/admin/users/{user_uid}/slots")
async def admin_update_user_slots(user_uid: str, data: dict = Body(...)):
    """
    Permite que o administrador ajuste manualmente o número de slots de um usuário.
    Exemplo de body:
    {
        "slots": 4
    }
    """
    print(f"🟡 Recebida requisição para atualizar slots de {user_uid} com dados: {data}")

    try:
        db = firestore.client()  # 🔹 Garante que o Firestore está inicializado
        user_ref = db.collection("users").document(user_uid)
        doc = user_ref.get()

        if not doc.exists:
            print(f"❌ Usuário {user_uid} não encontrado no Firestore.")
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        slots = data.get("slots")
        if not isinstance(slots, int) or slots < 0:
            print(f"⚠️ Valor inválido recebido para slots: {slots}")
            raise HTTPException(status_code=400, detail="O campo 'slots' deve ser um número inteiro não negativo.")

        # 🔹 Usa set com merge=True para garantir que o campo seja criado ou atualizado
        user_ref.set({"slots": slots}, merge=True)
        print(f"✅ Slots do usuário {user_uid} atualizados para {slots} no Firestore.")

        # 🔹 Lê novamente o documento atualizado
        updated = user_ref.get().to_dict()
        print(f"📄 Documento atualizado no Firestore: {updated}")

        return {"status": "ok", "message": f"Slots atualizados para {slots}.", "user": updated}

    except Exception as e:
        print(f"❌ Erro ao atualizar slots do usuário {user_uid}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar slots: {e}")



@app.post("/webhook/whatsapp-status")
async def whatsapp_status_webhook(request: Request):
    data = await request.json()
    
    print("\n📩 WEBHOOK WHATSAPP RECEBIDO")
    print(json.dumps(data, indent=2, ensure_ascii=False))

    try:
        message_id = data.get("messageId")
        status_value = data.get("status") or data.get("event")
        phone = data.get("phone")

        print(f"🔎 MSG: {message_id} | STATUS: {status_value} | DESTINO: {phone}")

        # (Opcional) salvar no Firestore depois
        # db = firestore.client()
        # db.collection("whatsapp_logs").add({
        #     "message_id": message_id,
        #     "status": status_value,
        #     "phone": phone,
        #     "timestamp": firestore.SERVER_TIMESTAMP
        # })

        return {"received": True}

    except Exception as e:
        print(f"❌ Erro processando webhook: {e}")
        return {"received": False}
