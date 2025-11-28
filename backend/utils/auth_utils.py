from fastapi import Request, HTTPException
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError

async def verify_firebase_token(request: Request):
    """
    Middleware de autenticação para validar ID Token do Firebase.
    Retorna o UID e e-mail do usuário autenticado.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Token não enviado. Use 'Authorization: Bearer <token>'."
        )

    token = auth_header.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Formato de token inválido."
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")

        if not uid:
            raise HTTPException(status_code=401, detail="Token inválido.")

        return {"uid": uid, "email": email}

    except FirebaseError as e:
        print("Erro no Firebase verify_id_token:", e)
        raise HTTPException(status_code=401, detail="Token expirado ou inválido.")

    except Exception as e:
        print("Erro inesperado:", e)
        raise HTTPException(status_code=401, detail="Token inválido.")
