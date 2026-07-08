import { useState, useEffect } from 'react';
import { Save, Loader2, Search } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/button';
import Input from '../common/input';
import BaseModal from '../common/BaseModal';

// ── Funções de Máscara ──────────────────────────────────────────────────────
const maskCpfCnpj = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF: xxx.xxx.xxx-xx
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ: xx.xxx.xxx/xxxx-xx
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const maskTelefone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    // Fixo: (xx) xxxx-xxxx
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // Celular: (xx) xxxxx-xxxx
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

const maskCep = (value) => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

export default function ClienteModal({ isOpen, onClose, clienteAtual, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    cep: '',
    endereco: '',
    cidade: ''
  });
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (clienteAtual) {
        setFormData({
          nome: clienteAtual.nome || '',
          email: clienteAtual.email || '',
          telefone: clienteAtual.telefone || '',
          cpf_cnpj: clienteAtual.cpf_cnpj || '',
          cep: '',
          endereco: clienteAtual.endereco || '',
          cidade: clienteAtual.cidade || ''
        });
      } else {
        setFormData({ nome: '', email: '', telefone: '', cpf_cnpj: '', cep: '', endereco: '', cidade: '' });
      }
    }
  }, [isOpen, clienteAtual]);

  if (!isOpen) return null;

  // Handler com máscaras automáticas
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cpf_cnpj') {
      const masked = maskCpfCnpj(value);
      if (masked.replace(/\D/g, '').length <= 14) {
        setFormData({ ...formData, cpf_cnpj: masked });
      }
      return;
    }

    if (name === 'telefone') {
      const masked = maskTelefone(value);
      if (masked.replace(/\D/g, '').length <= 11) {
        setFormData({ ...formData, telefone: masked });
      }
      return;
    }

    if (name === 'cep') {
      const masked = maskCep(value);
      if (masked.replace(/\D/g, '').length <= 8) {
        setFormData({ ...formData, cep: masked });
      }
      // Auto-busca quando completar 8 dígitos
      const digits = value.replace(/\D/g, '');
      if (digits.length === 8) {
        buscarCep(digits);
      }
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // ── Busca CEP via ViaCEP (API pública e gratuita) ──────────────────────
  const buscarCep = async (cep) => {
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErro('CEP não encontrado. Verifique e tente novamente.');
        return;
      }

      // Monta o endereço completo: logradouro + bairro
      const enderecoCompleto = [data.logradouro, data.bairro]
        .filter(Boolean)
        .join(' - ');

      setFormData(prev => ({
        ...prev,
        endereco: enderecoCompleto || prev.endereco,
        cidade: data.localidade ? `${data.localidade} - ${data.uf}` : prev.cidade
      }));
      setErro('');
    } catch {
      setErro('Erro ao buscar o CEP. Verifique sua conexão.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    // Enviar sem o campo CEP (não existe no backend)
    const { cep, ...payload } = formData;

    try {
      if (clienteAtual) {
        await api.patch(`/api/clientes/${clienteAtual.id}`, payload);
      } else {
        await api.post('/api/clientes/', payload);
      }
      
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

          <Input label="Nome" name="nome" value={formData.nome} onChange={handleChange} required />
          
          <Input 
            label="E-mail" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required
            pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
            title="Formato válido: email@provedor.com"
            placeholder="email@provedor.com"
          />
          
          <Input 
            label="CPF ou CNPJ" 
            name="cpf_cnpj" 
            value={formData.cpf_cnpj} 
            onChange={handleChange} 
            required 
            placeholder="000.000.000-00"
          />
          
          <Input 
            label="Telefone" 
            name="telefone" 
            value={formData.telefone} 
            onChange={handleChange} 
            placeholder="(92) 98485-1809"
          />
          
          {/* ── Bloco de Endereço por CEP ── */}
          <div style={{ position: 'relative' }}>
            <Input 
              label="CEP" 
              name="cep" 
              value={formData.cep} 
              onChange={handleChange} 
              placeholder="69000-000"
            />
            {buscandoCep && (
              <Loader2 
                size={18} 
                className="spinner" 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '38px', 
                  color: 'var(--color-primary)' 
                }} 
              />
            )}
          </div>

          <Input 
            label="Endereço" 
            name="endereco" 
            value={formData.endereco} 
            onChange={handleChange} 
            placeholder="Preenchido automaticamente pelo CEP"
          />
          
          <Input 
            label="Cidade" 
            name="cidade" 
            value={formData.cidade} 
            onChange={handleChange} 
            placeholder="Preenchido automaticamente pelo CEP"
          />
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
