import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function VisitaModal({ isOpen, onClose, visitaAtual, onSaveSuccess, readOnly = false }) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    tecnico_id: '',
    data_agendada: '',
    status: 'agendada',
    observacoes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [enderecoMaps, setEnderecoMaps] = useState('');

  useEffect(() => {
    const carregarDependencias = async () => {
      try {
        const [resClientes, resServicos, resUsuarios] = await Promise.all([
          api.get('/api/clientes/'),
          api.get('/api/servicos/'),
          api.get('/api/usuarios/')
        ]);
        setClientes(resClientes.data);
        setServicos(resServicos.data.filter(s => s.ativo));
        setTecnicos(resUsuarios.data.filter(u => u.role === 'tecnico' && u.ativo));
      } catch (err) {
        console.error("Erro ao carregar selects:", err);
      }
    };
    if (isOpen && !readOnly) {
      carregarDependencias();
    }
  }, [isOpen, readOnly]);

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (visitaAtual) {
        let dataFormatada = '';
        if (visitaAtual.data_agendada) {
          try {
            dataFormatada = new Date(visitaAtual.data_agendada).toISOString().slice(0, 16);
          } catch (e) {
            console.error("Data inválida:", visitaAtual.data_agendada);
          }
        }

        setFormData({
          cliente_id: visitaAtual.cliente_id || '',
          servico_id: visitaAtual.servico_id || '',
          tecnico_id: visitaAtual.tecnico_id || '',
          data_agendada: dataFormatada,
          status: visitaAtual.status || 'agendada',
          observacoes: visitaAtual.observacoes || ''
        });

        if (visitaAtual.cliente?.endereco) {
          const endereco = `${visitaAtual.cliente.endereco}, ${visitaAtual.cliente.cidade || ''}`;
          setEnderecoMaps(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
        } else {
          setEnderecoMaps('');
        }

      } else {
        setFormData({
          cliente_id: '',
          servico_id: '',
          tecnico_id: '',
          data_agendada: '',
          status: 'agendada',
          observacoes: ''
        });
        setEnderecoMaps('');
      }
    }
  }, [isOpen, visitaAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    if (readOnly) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    
    setLoading(true);
    setErro('');

    try {
      if (!formData.data_agendada) {
        throw new Error("Data de agendamento é obrigatória.");
      }

      const payload = {
        ...formData,
        data_agendada: new Date(formData.data_agendada).toISOString()
      };

      if (visitaAtual) {
        // No PATCH não enviamos cliente_id e servico_id
        const { cliente_id, servico_id, ...updatePayload } = payload;
        await api.patch(`/api/visitas/${visitaAtual.id}`, updatePayload);
      } else {
        await api.post('/api/visitas/', payload);
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
      } else if (error instanceof Error) {
        setErro(error.message);
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
            {readOnly ? 'Detalhes da Ordem de Serviço' : (visitaAtual ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço')}
          </h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {erro && <div className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{erro}</div>}

            <div className="form-group">
              <label className="form-label">Cliente {readOnly ? '' : '*'}</label>
              {readOnly ? (
                <div className="form-input" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                  {visitaAtual?.cliente?.nome || 'Cliente não encontrado'}
                </div>
              ) : (
                <select 
                  name="cliente_id" value={formData.cliente_id} onChange={handleChange}
                  className="form-input" required disabled={readOnly}
                >
                  <option value="" disabled>Selecione um cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.cpf_cnpj})</option>
                  ))}
                </select>
              )}
            </div>

            {readOnly && enderecoMaps && (
              <div className="form-group">
                <label className="form-label">Endereço do Cliente</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    {visitaAtual?.cliente?.endereco} {visitaAtual?.cliente?.cidade ? `- ${visitaAtual.cliente.cidade}` : ''}
                  </span>
                  <a 
                    href={enderecoMaps} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Abrir no Maps
                  </a>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Serviço Contratado {readOnly ? '' : '*'}</label>
              {readOnly ? (
                <div className="form-input" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                  {visitaAtual?.servico?.nome || 'Serviço não encontrado'}
                </div>
              ) : (
                <select 
                  name="servico_id" value={formData.servico_id} onChange={handleChange}
                  className="form-input" required disabled={readOnly}
                >
                  <option value="" disabled>Selecione um serviço...</option>
                  {servicos.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco_base}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Técnico Responsável</label>
              {readOnly ? (
                <div className="form-input" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                  {tecnicos.find(t => t.id === formData.tecnico_id)?.nome || 'Nenhum técnico alocado'}
                </div>
              ) : (
                <select 
                  name="tecnico_id" value={formData.tecnico_id || ''} onChange={handleChange}
                  className="form-input" disabled={readOnly}
                >
                  <option value="">Selecione um técnico (Opcional)...</option>
                  {tecnicos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Data e Hora Agendada {readOnly ? '' : '*'}</label>
              <input 
                type={readOnly ? "text" : "datetime-local"} name="data_agendada" 
                value={readOnly ? new Date(visitaAtual?.data_agendada).toLocaleString() : formData.data_agendada} 
                onChange={handleChange}
                className="form-input" required disabled={readOnly}
                style={readOnly ? { backgroundColor: 'var(--color-surface-hover)' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status da OS {readOnly ? '' : '*'}</label>
              <select 
                name="status" value={formData.status} onChange={handleChange}
                className="form-input" required disabled={readOnly}
                style={readOnly ? { backgroundColor: 'var(--color-surface-hover)' } : {}}
              >
                <option value="agendada">📅 Agendada</option>
                <option value="em_andamento">⏳ Em Andamento</option>
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
                disabled={readOnly}
                style={readOnly ? { backgroundColor: 'var(--color-surface-hover)' } : {}}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>
              {readOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={20} className="spinner" /> : <Save size={20} />}
                Salvar Ordem
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
