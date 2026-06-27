import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function VisitaModal({ isOpen, onClose, visitaAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    data_visita: '',
    status: 'agendada',
    garantia_dias: 0,
    observacoes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  // Listas para popular os Selects (Dropdowns)
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  // Busca os dados relacionais assim que o componente for "montado" no navegador
  useEffect(() => {
    const carregarDependencias = async () => {
      try {
        const [resClientes, resServicos] = await Promise.all([
          api.get('/api/clientes/'),
          api.get('/api/servicos/')
        ]);
        setClientes(resClientes.data);
        // Filtra apenas os serviços que estão ativos para aparecerem no Select
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
        // Se estiver editando, precisamos formatar a data que vem do banco para o <input type="datetime-local">
        const dataFormatada = visitaAtual.data_visita 
          ? new Date(visitaAtual.data_visita).toISOString().slice(0, 16) 
          : '';

        setFormData({
          cliente_id: visitaAtual.cliente_id || '',
          servico_id: visitaAtual.servico_id || '',
          data_visita: dataFormatada,
          status: visitaAtual.status || 'agendada',
          garantia_dias: visitaAtual.garantia_dias || 0,
          observacoes: visitaAtual.observacoes || ''
        });
      } else {
        setFormData({
          cliente_id: '',
          servico_id: '',
          data_visita: '',
          status: 'agendada',
          garantia_dias: 0,
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
      // Formata os tipos corretamente para o Pydantic do backend
      const payload = {
        ...formData,
        garantia_dias: parseInt(formData.garantia_dias) || 0,
        // O input datetime-local envia algo como "2023-10-15T14:30". Precisamos garantir formato ISO.
        data_visita: new Date(formData.data_visita).toISOString()
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
        setErro(error.response.data.detail);
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
            
            {erro && <div className="error-message">{erro}</div>}

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
                type="datetime-local" name="data_visita" 
                value={formData.data_visita} onChange={handleChange}
                className="form-input" required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              {/* Implementação da "Open Question": Select de Garantias */}
              <div className="form-group">
                <label className="form-label">Tempo de Garantia *</label>
                <select 
                  name="garantia_dias" value={formData.garantia_dias} onChange={handleChange}
                  className="form-input" required 
                >
                  <option value="0">Sem Garantia</option>
                  <option value="30">30 Dias (1 Mês)</option>
                  <option value="90">90 Dias (3 Meses)</option>
                  <option value="180">180 Dias (6 Meses)</option>
                  <option value="365">365 Dias (1 Ano)</option>
                </select>
              </div>
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
