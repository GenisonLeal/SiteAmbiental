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


def _get_base_html(titulo: str, conteudo: str) -> str:
    """Retorna o template HTML base para os e-mails."""
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f3f4f6; color: #374151;">
        <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%; background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 0 auto;">
                        <!-- Cabeçalho -->
                        <tr>
                            <td style="background-color: #059669; padding: 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Protecta Ambiental</h1>
                            </td>
                        </tr>
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #111827; margin-top: 0; font-size: 20px;">{titulo}</h2>
                                {conteudo}
                            </td>
                        </tr>
                        <!-- Rodapé -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                    © 2024 Protecta Ambiental. Todos os direitos reservados.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def send_password_reset_email(email_destinatario: str, reset_link: str):
    """
    Envia um e-mail HTML para o usuário com o link para redefinir a senha.
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

    texto = f"Acesse o link para redefinir a senha: {reset_link}"
    msg.set_content(texto)

    conteudo_html = f"""
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Você solicitou a redefinição da sua senha no sistema da Protecta Ambiental.
            Clique no botão abaixo para criar uma nova senha:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
            Este link é válido por 30 minutos.<br>
            Se você não solicitou essa redefinição, por favor ignore este e-mail.
        </p>
    """
    msg.add_alternative(_get_base_html("Recuperação de Senha", conteudo_html), subtype='html')

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail de recuperação: {e}")
        raise


def send_agendamento_email(email_destinatario: str, data_str: str, servico_nome: str):
    """Notifica o cliente sobre um novo agendamento."""
    if not settings.smtp_user or not settings.smtp_password:
        print(f"⚠️ Simulação de E-mail de Agendamento para: {email_destinatario}")
        return

    msg = EmailMessage()
    msg['Subject'] = "Confirmação de Agendamento - Protecta Ambiental"
    msg['From'] = settings.email_from_name
    msg['To'] = email_destinatario
    msg.set_content(f"Seu agendamento para {servico_nome} foi confirmado para {data_str}.")

    conteudo = f"""
        <p style="font-size: 16px; line-height: 1.6;">Olá!</p>
        <p style="font-size: 16px; line-height: 1.6;">Seu agendamento foi confirmado com sucesso. Abaixo estão os detalhes do serviço:</p>
        <ul style="font-size: 16px; line-height: 1.6; background-color: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0; list-style-type: none;">
            <li style="margin-bottom: 10px;"><strong>Serviço:</strong> {servico_nome}</li>
            <li><strong>Data e Hora:</strong> {data_str}</li>
        </ul>
        <p style="font-size: 16px; line-height: 1.6;">Nosso técnico chegará ao local no horário combinado. Se precisar remarcar, entre em contato com nosso atendimento.</p>
    """
    msg.add_alternative(_get_base_html("Agendamento Confirmado", conteudo), subtype='html')

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail de agendamento: {e}")


def send_conclusao_email(email_destinatario: str, servico_nome: str):
    """Notifica o cliente sobre a conclusão de um serviço."""
    if not settings.smtp_user or not settings.smtp_password:
        print(f"⚠️ Simulação de E-mail de Conclusão para: {email_destinatario}")
        return

    msg = EmailMessage()
    msg['Subject'] = "Serviço Concluído - Protecta Ambiental"
    msg['From'] = settings.email_from_name
    msg['To'] = email_destinatario
    msg.set_content(f"O serviço de {servico_nome} foi concluído com sucesso.")

    conteudo = f"""
        <p style="font-size: 16px; line-height: 1.6;">Olá!</p>
        <p style="font-size: 16px; line-height: 1.6;">Informamos que o serviço de <strong>{servico_nome}</strong> foi concluído com sucesso pela nossa equipe técnica.</p>
        <p style="font-size: 16px; line-height: 1.6;">Agradecemos por escolher a Protecta Ambiental para cuidar do seu ambiente. Caso haja qualquer dúvida ou precise de assistência, estamos à disposição.</p>
        <p style="font-size: 16px; line-height: 1.6;">O certificado de garantia e a ordem de serviço já estão disponíveis no seu portal do cliente.</p>
    """
    msg.add_alternative(_get_base_html("Serviço Concluído", conteudo), subtype='html')

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail de conclusão: {e}")


def send_cobranca_email(email_destinatario: str, valor: str, vencimento: str):
    """Notifica o cliente sobre uma nova cobrança gerada."""
    if not settings.smtp_user or not settings.smtp_password:
        print(f"⚠️ Simulação de E-mail de Cobrança para: {email_destinatario}")
        return

    msg = EmailMessage()
    msg['Subject'] = "Nova Fatura Disponível - Protecta Ambiental"
    msg['From'] = settings.email_from_name
    msg['To'] = email_destinatario
    msg.set_content(f"Uma fatura no valor de R$ {valor} com vencimento em {vencimento} foi gerada.")

    conteudo = f"""
        <p style="font-size: 16px; line-height: 1.6;">Olá!</p>
        <p style="font-size: 16px; line-height: 1.6;">Uma nova fatura referente aos serviços prestados foi gerada em nosso sistema.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin-top: 0;">Valor da Fatura</p>
            <h3 style="font-size: 28px; color: #059669; margin: 5px 0;">R$ {valor}</h3>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">Vencimento: <strong>{vencimento}</strong></p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">Você pode visualizar o boleto ou realizar o pagamento via PIX acessando o seu Portal do Cliente no nosso site.</p>
    """
    msg.add_alternative(_get_base_html("Nova Fatura", conteudo), subtype='html')

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail de cobrança: {e}")
