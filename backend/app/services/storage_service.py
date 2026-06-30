import boto3
from botocore.exceptions import ClientError
from app.config import settings

def get_s3_client():
    """Retorna um cliente boto3 configurado para o Object Storage (ex: Magalu Cloud S3)."""
    if not settings.s3_endpoint_url or not settings.s3_access_key or not settings.s3_secret_key:
        return None

    return boto3.client(
        's3',
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region
    )

def upload_file_to_s3(file_data: bytes, file_name: str, content_type: str = "application/pdf") -> str | None:
    """
    Faz o upload de um arquivo em memória (bytes) para o Object Storage.
    Retorna a URL pública do arquivo (ou chave) em caso de sucesso.
    """
    s3_client = get_s3_client()
    if not s3_client or not settings.s3_bucket_name:
        print(f"⚠️ Aviso: Object Storage não configurado. Salvando apenas localmente: {file_name}")
        return None

    try:
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=file_name,
            Body=file_data,
            ContentType=content_type,
            ACL='public-read' # Assumindo que queremos que o cliente baixe via URL pública
        )
        # Monta a URL pública (ajuste conforme o padrão da Magalu Cloud)
        url = f"{settings.s3_endpoint_url}/{settings.s3_bucket_name}/{file_name}"
        return url
    except ClientError as e:
        print(f"Erro ao fazer upload para S3: {e}")
        return None
