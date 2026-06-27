import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function ServicoModal({ isOpen, onClose, servicoAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_base: '',
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (servicoAtual) {
        setFormData({
          nome: servicoAtual.nome || '',
          descricao: servicoAtual.descricao || '',
          preco_base: servicoAtual.preco_base || '',
          ativo: servicoAtual.ativo !== false // se for undefined ou true, vira true
        });
      } else {
        setFormData({ nome: '', descricao: '', preco_base: '', ativo: true });
      }
    }
  }, [isOpen, servicoAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Como o preco_base pode vir com vírgula do usuário, nós arrumamos para o backend (que espera ponto Decimal)
      let precoTratado = formData.preco_base.toString().replace(',', '.');
      
      const payload = {
        ...formData,
        preco_base: parseFloat(precoTratado) || 0
      };

      if (servicoAtual) {
        await api.patch(`/api/servicos/${servicoAtual.id}`, payload);
      } else {
        await api.post('/api/servicos/', payload);
      }
      
      onSaveSuccess();
      onClose();

    } catch (error) {
      if (error.response?.data?.detail) {
        setErro(error.response.data.detail);
      } else {
        setErro("Ocorreu um erro ao salvar o serviço.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        <div className="modal-header">
          <h3 className="modal-title">
            {servicoAtual ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {erro && (
              <div className="error-message">
                {erro}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome do Serviço *</label>
              <input 
                name="nome" value={formData.nome} onChange={handleChange}
                className="form-input" required 
                placeholder="Ex: Descupinização Completa"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preço Base (R$) *</label>
              <input 
                name="preco_base" value={formData.preco_base} onChange={handleChange}
                className="form-input" required 
                placeholder="Ex: 150.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição (Opcional)</label>
              <textarea 
                name="descricao" value={formData.descricao} onChange={handleChange}
                className="form-input" rows="3"
                placeholder="Detalhes sobre como o serviço é executado..."
              />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" name="ativo" 
                checked={formData.ativo} onChange={handleChange} 
                id="checkbox-ativo"
              />
              <label className="form-label" htmlFor="checkbox-ativo" style={{ marginBottom: 0 }}>
                Serviço Ativo (Visível para novos contratos)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
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
