"""
Funções de segurança para autenticação.
Lida com hash de senhas e geração de tokens JWT.
"""
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config import settings

# Configuração do passlib para usar o algoritmo bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """
    Recebe a senha em texto puro e retorna um hash irreversível.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto puro informada no login corresponde
    ao hash salvo no banco de dados.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Cria um JSON Web Token (JWT) assinado com a nossa SECRET_KEY.

    Args:
        data: payload contendo os dados do usuário (ex: id, email, role).
        expires_delta: tempo de vida do token.
    """
    to_encode = data.copy()

    # Define o momento de expiração do token (em UTC)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})

    # Assina e converte para string
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )

    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    """
    Cria um token JWT específico para redefinição de senha,
    válido por 30 minutos.
    """
    expires = timedelta(minutes=30)
    # Colocamos um type='reset' para diferenciar de um token de login
    return create_access_token(
        data={"sub": email, "type": "reset"},
        expires_delta=expires
    )


def verify_password_reset_token(token: str) -> str | None:
    """
    Decodifica o token de reset e retorna o e-mail se for válido.
    Retorna None se for inválido, expirado ou de tipo incorreto.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "reset":
            return None
            
        return email
    except jwt.JWTError:
        return None
