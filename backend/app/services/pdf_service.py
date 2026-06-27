"""
Serviço responsável por gerar a Ordem de Serviço (OS) e Certificado de Garantia em PDF.
"""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.models.cliente import Cliente
from app.models.servico import Servico
from app.models.visita import Visita


def gerar_os_pdf(visita: Visita, cliente: Cliente, servico: Servico) -> bytes:
    """
    Desenha o PDF da Ordem de Serviço / Certificado usando o ReportLab.
    O PDF é desenhado na memória (BytesIO) e retornado como bytes brutos
    para que a API possa fazer o envio (download) direto para o navegador do cliente.
    """
    buffer = BytesIO()
    
    # Criamos o canvas apontando para a memória em vez de um arquivo no disco
    c = canvas.Canvas(buffer, pagesize=A4)
    largura, altura = A4

    # ── Cabeçalho (Header) ──────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#0F4C81")) # Cor primária da marca Protecta
    c.rect(0, altura - 80, largura, 80, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, altura - 50, "PROTECTA DEDETIZAÇÃO")
    
    c.setFont("Helvetica", 12)
    c.drawString(40, altura - 70, "Certificado de Garantia e Ordem de Serviço")

    # ── Dados do Cliente ────────────────────────────────────────────────────
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, altura - 120, "DADOS DO CLIENTE")
    
    c.setFont("Helvetica", 12)
    c.drawString(40, altura - 140, f"Nome: {cliente.nome}")
    c.drawString(40, altura - 160, f"CPF/CNPJ: {cliente.cpf_cnpj}")
    c.drawString(40, altura - 180, f"Endereço: {cliente.endereco or 'Não informado'}")
    c.drawString(40, altura - 200, f"Telefone: {cliente.telefone}")

    # ── Dados do Serviço ────────────────────────────────────────────────────
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, altura - 250, "DADOS DO SERVIÇO")
    
    c.setFont("Helvetica", 12)
    c.drawString(40, altura - 270, f"Serviço Realizado: {servico.nome}")
    
    data_formatada = visita.data_realizada.strftime("%d/%m/%Y") if visita.data_realizada else "Pendente"
    c.drawString(40, altura - 290, f"Data da Execução: {data_formatada}")
    
    status_str = visita.status.value.replace("_", " ").title()
    c.drawString(40, altura - 310, f"Status: {status_str}")

    # ── Observações (Garantia) ──────────────────────────────────────────────
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, altura - 360, "OBSERVAÇÕES E GARANTIA")
    
    c.setFont("Helvetica", 12)
    obs = visita.observacoes if visita.observacoes else "Garantia padrão de 6 meses contra reinfestação."
    
    # Quebra de linha simples (em produção ideal usar platypus.Paragraph para texto longo)
    text_object = c.beginText(40, altura - 380)
    for linha in obs.split('\n'):
        text_object.textLine(linha)
    c.drawText(text_object)

    # ── Assinaturas ─────────────────────────────────────────────────────────
    c.line(40, 150, 250, 150)
    c.drawString(80, 135, "Assinatura do Técnico")

    c.line(300, 150, 510, 150)
    c.drawString(340, 135, "Assinatura do Cliente")

    # ── Rodapé ──────────────────────────────────────────────────────────────
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(colors.gray)
    c.drawString(40, 50, "Documento gerado eletronicamente pelo Sistema Protecta.")

    c.save()
    
    # Retorna o PDF construído e fecha o buffer de memória
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
