import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/button';
import Input from '../common/input';
import BaseModal from '../common/BaseModal';

export default function ClienteModal({ isOpen, onClose, clienteAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    endereco: '',
    cidade: ''
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
          endereco: clienteAtual.endereco || '',
          cidade: clienteAtual.cidade || ''
        });
      } else {
        // Modo Criação
        setFormData({ nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', cidade: '' });
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
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={clienteAtual ? 'Editar Cliente' : 'Novo Cliente'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          
          {erro && (
            <div className="error-message">
              {erro}
            </div>
          )}

          {/* Inputs do Formulário usando componente genérico */}
          <Input label="Nome" name="nome" value={formData.nome} onChange={handleChange} required />
          <Input label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="CPF ou CNPJ" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} required />
          <Input label="Telefone (Opcional)" name="telefone" value={formData.telefone} onChange={handleChange} />
          <Input label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Ex: Rua das Flores, 123 - Bairro" />
          <Input label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Ex: Manaus" />
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} icon={Save}>
            Salvar
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
