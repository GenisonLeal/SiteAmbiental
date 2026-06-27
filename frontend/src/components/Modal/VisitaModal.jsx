import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function VisitaModal({ isOpen, onClose, visitaAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    data_agendada: '',
    status: 'agendada',
    observacoes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    const carregarDependencias = async () => {
      try {
        const [resClientes, resServicos] = await Promise.all([
          api.get('/api/clientes/'),
          api.get('/api/servicos/')
        ]);
        setClientes(resClientes.data);
        setServicos(resServicos.data.filter(s => s.ativo));
      } catch (err) {
        console.error("Erro ao carregar selects:", err);
      }
    };
    carregarDependencias();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (visitaAtual) {
        const dataFormatada = visitaAtual.data_agendada 
          ? new Date(visitaAtual.data_agendada).toISOString().slice(0, 16) 
          : '';

        setFormData({
          cliente_id: visitaAtual.cliente_id || '',
          servico_id: visitaAtual.servico_id || '',
          data_agendada: dataFormatada,
          status: visitaAtual.status || 'agendada',
          observacoes: visitaAtual.observacoes || ''
        });
      } else {
        setFormData({
          cliente_id: '',
          servico_id: '',
          data_agendada: '',
          status: 'agendada',
          observacoes: ''
        });
      }
    }
  }, [isOpen, visitaAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const payload = {
        ...formData,
        data_agendada: new Date(formData.data_agendada).toISOString()
      };

      if (visitaAtual) {
        await api.patch(`/api/visitas/${visitaAtual.id}`, payload);
      } else {
        await api.post('/api/visitas/', payload);
      }
      
      onSaveSuccess();
      onClose();

    } catch (error) {
      if (error.response?.data?.detail) {
        // O FastAPI retorna um Array de objetos no detalhe do Erro 422
        // Precisamos transformar isso numa String para o React não quebrar.
        const detalhe = error.response.data.detail;
        if (Array.isArray(detalhe)) {
          setErro(detalhe.map(d => `${d.loc.join('.')}: ${d.msg}`).join(' | '));
        } else {
          setErro(detalhe);
        }
      } else {
        setErro("Ocorreu um erro ao salvar a Ordem de Serviço.");
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
            {visitaAtual ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {erro && <div className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{erro}</div>}

            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select 
                name="cliente_id" value={formData.cliente_id} onChange={handleChange}
                className="form-input" required 
              >
                <option value="" disabled>Selecione um cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.cpf_cnpj})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Serviço Contratado *</label>
              <select 
                name="servico_id" value={formData.servico_id} onChange={handleChange}
                className="form-input" required 
              >
                <option value="" disabled>Selecione um serviço...</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco_base}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data e Hora Agendada *</label>
              <input 
                type="datetime-local" name="data_agendada" 
                value={formData.data_agendada} onChange={handleChange}
                className="form-input" required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status da OS *</label>
              <select 
                name="status" value={formData.status} onChange={handleChange}
                className="form-input" required 
              >
                <option value="agendada">📅 Agendada</option>
                <option value="concluida">✅ Concluída</option>
                <option value="cancelada">❌ Cancelada</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Observações Internas</label>
              <textarea 
                name="observacoes" value={formData.observacoes} onChange={handleChange}
                className="form-input" rows="3"
                placeholder="Ex: Levar escada grande, cliente tem cachorros bravos..."
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={20} className="spinner" /> : <Save size={20} />}
              Salvar Ordem
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
