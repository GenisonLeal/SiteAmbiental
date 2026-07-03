import { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './Auditoria.css';

export default function AuditoriaList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auditoria/');
        setLogs(response.data);
      } catch (err) {
        console.error('Erro ao buscar logs:', err);
        setError('Não foi possível carregar os logs. Acesso restrito a Administradores.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={24} color="var(--color-primary)" />
          Logs do Sistema
        </h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '5px 0 0 0' }}>
          Histórico de auditoria de ações críticas no painel.
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto 10px auto' }} />
            <p>Carregando registros...</p>
          </div>
        ) : !Array.isArray(logs) || logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Nenhum registro de auditoria encontrado.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Entidade (ID)</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.data_hora)}</td>
                    <td><strong>{log.usuario_email}</strong></td>
                    <td>
                      <span className={`badge ${log.acao}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td>
                      {log.entidade} {log.entidade_id ? `(#${log.entidade_id})` : ''}
                    </td>
                    <td>
                      <div className="log-details" title={log.detalhes ? JSON.stringify(log.detalhes, null, 2) : ''}>
                        {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
