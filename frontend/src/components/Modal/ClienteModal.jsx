import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function ClienteModal({ isOpen, onClose, clienteAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    endereco: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Toda vez que o modal abrir ou fechar, ou o "clienteAtual" mudar,
  // nós resetamos ou preenchemos o formulário.
  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (clienteAtual) {
        // Modo Edição
        setFormData({
          nome: clienteAtual.nome || '',
          email: clienteAtual.email || '',
          telefone: clienteAtual.telefone || '',
          cpf_cnpj: clienteAtual.cpf_cnpj || '',
          endereco: clienteAtual.endereco || ''
        });
      } else {
        // Modo Criação
        setFormData({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '' });
      }
    }
  }, [isOpen, clienteAtual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      if (clienteAtual) {
        // PATCH: Editando cliente existente
        await api.patch(`/api/clientes/${clienteAtual.id}`, formData);
      } else {
        // POST: Criando novo cliente
        await api.post('/api/clientes/', formData);
      }
      
      // Fecha o modal e avisa a tabela para buscar os dados de novo!
      onSaveSuccess();
      onClose();

    } catch (error) {
      if (error.response?.data?.detail) {
        setErro(error.response.data.detail);
      } else {
        setErro("Ocorreu um erro ao salvar o cliente.");
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
            {clienteAtual ? 'Editar Cliente' : 'Novo Cliente'}
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

            {/* Inputs do Formulário usando as classes do Login.css por reuso ou globais */}
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input 
                name="nome" value={formData.nome} onChange={handleChange}
                className="form-input" required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input 
                name="email" type="email" value={formData.email} onChange={handleChange}
                className="form-input" required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">CPF ou CNPJ *</label>
              <input 
                name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange}
                className="form-input" required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone (Opcional)</label>
              <input 
                name="telefone" value={formData.telefone} onChange={handleChange}
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Endereço (Opcional)</label>
              <input 
                name="endereco" value={formData.endereco} onChange={handleChange}
                className="form-input" 
              />
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
