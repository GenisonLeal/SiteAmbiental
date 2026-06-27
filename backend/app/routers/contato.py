"""
Rotas públicas para o site da empresa.
"""
from fastapi import APIRouter, HTTPException, status

from app.schemas.contato import ContatoRequest
from app.worker.tasks import disparar_email_async

# Nota: NÃO importamos e não usamos o Depends(get_current_user)
# pois esta é uma rota PÚBLICA do site.
router = APIRouter(
    prefix="/api/contato",
    tags=["Público (Site)"]
)


@router.post("/", status_code=status.HTTP_200_OK)
async def enviar_contato(payload: ContatoRequest):
    """
    Recebe os dados do formulário de contato do site público e
    dispara um e-mail para a caixa de entrada da empresa.
    """
    try:
        # Agora a API NÃO FICA MAIS TRAVADA esperando o Gmail!
        # Ela apenas "anota" no Redis e o Celery resolve depois.
        disparar_email_async.delay(
            nome=payload.nome,
            email=payload.email,
            telefone=payload.telefone,
            mensagem=payload.mensagem
        )
        return {"message": "Contato recebido e processado em background."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao tentar enviar o e-mail."
        )
