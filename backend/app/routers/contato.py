"""
Rotas públicas para o site da empresa.
"""
from fastapi import APIRouter, HTTPException, status

from app.schemas.contato import ContatoRequest
from app.services.email_service import send_contact_email

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
        # A chamada do SMTP é síncrona. Em um cenário de alto tráfego
        # o ideal seria jogar isso para o Celery (assíncrono) para não
        # prender o cliente na tela de carregamento. Como é o início,
        # vamos fazer assim.
        send_contact_email(
            nome=payload.nome,
            email_remetente=payload.email,
            telefone=payload.telefone,
            mensagem=payload.mensagem
        )
        return {"message": "Contato enviado com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao tentar enviar o e-mail."
        )
