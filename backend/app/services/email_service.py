"""
Serviço responsável por envio de e-mails usando SMTP.
"""
import smtplib
from email.message import EmailMessage

from app.config import settings


def send_contact_email(nome: str, email_remetente: str, telefone: str | None, mensagem: str):
    """
    Constrói a mensagem e envia para a caixa de e-mail da empresa.
    """
    if not settings.smtp_user or not settings.smtp_password:
        print("⚠️ Aviso: Credenciais SMTP não configuradas no .env. O e-mail não será enviado de fato.")
        return

    # O destinatário do e-mail de contato é a própria empresa
    destinatario = settings.smtp_user

    # Constrói o corpo do e-mail
    msg = EmailMessage()
    msg['Subject'] = f"Novo Contato pelo Site: {nome}"
    msg['From'] = settings.email_from_name
    msg['To'] = destinatario

    corpo = f"""
Você recebeu uma nova mensagem pelo formulário de contato do site público:

Nome: {nome}
E-mail: {email_remetente}
Telefone: {telefone or 'Não informado'}

Mensagem:
{mensagem}
    """
    msg.set_content(corpo)

    # Conecta ao servidor SMTP (Ex: smtp.gmail.com)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()  # Inicia criptografia TLS
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail via SMTP: {e}")
        # Lançar exceção ou não depende de como você quer que a API se comporte.
        # Aqui vamos deixar passar para que possamos logar sem derrubar a requisição,
        # mas em produção seria ideal tratar e talvez retornar Erro 500.
        raise


def send_password_reset_email(email_destinatario: str, reset_link: str):
    """
    Envia um e-mail para o usuário com o link para redefinir a senha.
    """
    if not settings.smtp_user or not settings.smtp_password:
        print(f"⚠️ Aviso: Credenciais SMTP não configuradas. Simulação de E-mail de Reset:")
        print(f"--- Para: {email_destinatario}")
        print(f"--- Link: {reset_link}")
        return

    msg = EmailMessage()
    msg['Subject'] = "Recuperação de Senha - Protecta Ambiental"
    msg['From'] = settings.email_from_name
    msg['To'] = email_destinatario

    corpo = f"""
Você solicitou a redefinição da sua senha no sistema da Protecta Ambiental.

Clique no link abaixo para criar uma nova senha:
{reset_link}

Este link é válido por 30 minutos.
Se você não solicitou essa redefinição, por favor ignore este e-mail.
    """
    msg.set_content(corpo)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail de recuperação: {e}")
        raise
