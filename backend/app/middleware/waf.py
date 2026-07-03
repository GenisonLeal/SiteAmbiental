import re
import urllib.parse
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Padrões comuns de ataque
SQL_INJECTION_PATTERN = re.compile(
    r"(?i)(?:union\s+all\s+select|waitfor\s+delay|1=1|--|;.*?--|drop\s+table|insert\s+into|update\s+.*?set)"
)
XSS_PATTERN = re.compile(
    r"(?i)(?:<script.*?>.*?</script>|javascript:|on\w+\s*=|<img.*?src=.*?onerror=|<svg.*?onload=)"
)
PATH_TRAVERSAL_PATTERN = re.compile(
    r"(?i)(?:\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c|/etc/passwd|/windows/win\.ini)"
)

class WAFMiddleware(BaseHTTPMiddleware):
    async def set_body(self, request: Request, body: bytes):
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive

    async def get_body(self, request: Request) -> bytes:
        body = await request.body()
        await self.set_body(request, body)
        return body

    async def dispatch(self, request: Request, call_next):
        # 1. Verifica os Query Parameters (URL)
        url_decoded = urllib.parse.unquote(str(request.url))
        if self.is_malicious(url_decoded):
            return self.block_request("Padrão suspeito na URL (WAF)")

        # 2. Verifica os Headers
        for key, value in request.headers.items():
            if self.is_malicious(value):
                return self.block_request("Padrão suspeito nos Cabeçalhos (WAF)")

        # 3. Verifica o Corpo da Requisição (JSON/Form)
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await self.get_body(request)
                body_str = urllib.parse.unquote(body_bytes.decode("utf-8", errors="ignore"))
                
                if self.is_malicious(body_str):
                    return self.block_request("Padrão suspeito no Corpo da Requisição (WAF)")
            except Exception:
                pass # Em caso de erro na leitura, deixa prosseguir ou bloqueia? Deixa prosseguir.

        # Se tudo estiver limpo, passa a requisição adiante
        response = await call_next(request)
        
        # Opcional: Adicionar headers de segurança na resposta diretamente na aplicação
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response

    def is_malicious(self, content: str) -> bool:
        """Verifica se o conteúdo corresponde a algum padrão de ataque."""
        if not content:
            return False
            
        if SQL_INJECTION_PATTERN.search(content):
            return True
        if XSS_PATTERN.search(content):
            return True
        if PATH_TRAVERSAL_PATTERN.search(content):
            return True
            
        return False

    def block_request(self, reason: str):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Acesso bloqueado pelo WAF: Atividade maliciosa detectada.", "reason": reason}
        )
