import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function CobrancaModal({ isOpen, onClose, cobrancaAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    visita_id: '',
    valor: '',
    data_vencimento: '',
    data_pagamento: '',
    status_pagamento: 'pendente',
    forma_pagamento: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [visitas, setVisitas] = useState([]);

  useEffect(() => {
    const carregarVisitas = async () => {
      try {
        const response = await api.get('/api/visitas/');
        // Ordenamos para mostrar as visitas mais recentes no select
        const ordenadas = response.data.sort((a, b) => new Date(b.data_agendada) - new Date(a.data_agendada));
        setVisitas(ordenadas);
      } catch (err) {
        console.error("Erro ao carregar visitas:", err);
      }
    };
    carregarVisitas();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (cobrancaAtual) {
        setFormData({
          visita_id: cobrancaAtual.visita_id || '',
          valor: cobrancaAtual.valor || '',
          data_vencimento: cobrancaAtual.data_vencimento || '',
          data_pagamento: cobrancaAtual.data_pagamento || '',
          status_pagamento: cobrancaAtual.status_pagamento || 'pendente',
          forma_pagamento: cobrancaAtual.forma_pagamento || ''
        });
      } else {
        setFormData({
          visita_id: '',
          valor: '',
          data_vencimento: '',
          data_pagamento: '',
          status_pagamento: 'pendente',
          forma_pagamento: ''
        });
      }
    }
  }, [isOpen, cobrancaAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      let precoTratado = formData.valor.toString().replace(',', '.');
      
      const payload = {
        ...formData,
        valor: parseFloat(precoTratado) || 0,
        // O Pydantic espera None (null) se a string estiver vazia para o data_pagamento e forma_pagamento
        data_pagamento: formData.data_pagamento || null,
        forma_pagamento: formData.forma_pagamento || null
      };

      if (cobrancaAtual) {
        await api.patch(`/api/cobrancas/${cobrancaAtual.id}`, payload);
      } else {
        await api.post('/api/cobrancas/', payload);
      }
      
      onSaveSuccess();
      onClose();

    } catch (error) {
      if (error.response?.data?.detail) {
        const detalhe = error.response.data.detail;
        if (Array.isArray(detalhe)) {
          setErro(detalhe.map(d => `${d.loc.join('.')}: ${d.msg}`).join(' | '));
        } else {
          setErro(detalhe);
        }
      } else {
        setErro("Ocorreu um erro ao salvar a cobrança.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formataDataBrasil = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        <div className="modal-header">
          <h3 className="modal-title">
            {cobrancaAtual ? 'Editar Cobrança' : 'Nova Cobrança'}
          </h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {erro && <div className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{erro}</div>}

            <div className="form-group">
              <label className="form-label">Ordem de Serviço Referente *</label>
              <select 
                name="visita_id" value={formData.visita_id} onChange={handleChange}
                className="form-input" required 
                disabled={!!cobrancaAtual} // Se estiver editando, não pode mudar a OS origem
              >
                <option value="" disabled>Selecione a Ordem de Serviço...</option>
                {visitas.map(v => (
                  <option key={v.id} value={v.id}>
                    OS de {formataDataBrasil(v.data_agendada)} - {v.cliente?.nome || 'Cliente Oculto'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input 
                  name="valor" value={formData.valor} onChange={handleChange}
                  className="form-input" required 
                  placeholder="Ex: 250.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Vencimento *</label>
                {/* type="date" envia YYYY-MM-DD pro Pydantic, que é perfeito para campos "date" */}
                <input 
                  type="date" name="data_vencimento" 
                  value={formData.data_vencimento} onChange={handleChange}
                  className="form-input" required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Status do Pagamento *</label>
                <select 
                  name="status_pagamento" value={formData.status_pagamento} onChange={handleChange}
                  className="form-input" required 
                >
                  <option value="pendente">⏳ Pendente</option>
                  <option value="pago">✅ Pago</option>
                  <option value="atrasado">🚨 Atrasado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Data de Pagamento</label>
                <input 
                  type="date" name="data_pagamento" 
                  value={formData.data_pagamento} onChange={handleChange}
                  className="form-input" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Forma de Pagamento</label>
              <select 
                name="forma_pagamento" value={formData.forma_pagamento} onChange={handleChange}
                className="form-input" 
              >
                <option value="">(Não informado)</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro Físico</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto Bancário</option>
              </select>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={20} className="spinner" /> : <Save size={20} />}
              Salvar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
