import { Link } from 'react-router-dom';
import { Leaf, Bug, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import './Landing.css';

export default function LandingHome() {
  return (
    <div className="landing-container">
      
      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <Leaf size={28} />
          Protecta Ambiental
        </div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#empresa">A Empresa</a>
          <a href="#servicos">Serviços</a>
          <a href="#contato">Contato</a>
          <Link to="/login" className="btn-login-nav">Área do Cliente</Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section id="home" className="hero-section">
        <h1 className="hero-title">
          Ambientes Seguros e Livres de <span>Pragas</span>
        </h1>
        <p className="hero-subtitle">
          Soluções definitivas e ecologicamente corretas para residências, condomínios e indústrias. Proteja seu patrimônio com a tecnologia da Protecta Ambiental.
        </p>
        <div className="hero-buttons">
          <a href="#servicos" className="btn-hero-primary">Conhecer Serviços</a>
          <a href="#contato" className="btn-hero-outline">Fale Conosco</a>
        </div>
      </section>

      {/* ── EMPRESA ── */}
      <section id="empresa" className="section">
        <div className="empresa-content">
          <div className="empresa-image-placeholder">
            {/* Em produção, aqui iria uma foto real da equipe ou do carro da empresa */}
          </div>
          <div className="empresa-text">
            <h2 className="section-title" style={{ textAlign: 'left' }}>Nossa História</h2>
            <p>
              Com mais de 10 anos de experiência no mercado de controle de pragas urbanas, a Protecta Ambiental nasceu com a missão de oferecer um serviço de excelência focado na saúde e bem-estar das pessoas.
            </p>
            <p>
              Utilizamos produtos licenciados pela Anvisa, técnicas modernas e profissionais altamente capacitados para resolver seu problema sem agredir o meio ambiente ou colocar sua família em risco.
            </p>
            <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '1rem' }}>
              Nosso compromisso é com a sua tranquilidade.
            </p>
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ── */}
      <section id="servicos" className="section" style={{ backgroundColor: 'white' }}>
        <h2 className="section-title">Nossas Especialidades</h2>
        <p className="section-subtitle">Técnicas avançadas para cada tipo de necessidade.</p>
        
        <div className="servicos-grid">
          
          <div className="servico-card">
            <div className="servico-icon"><Bug size={32} /></div>
            <h3>Desinsetização</h3>
            <p>
              Controle eficaz de baratas, formigas, moscas e mosquitos. Aplicação via pulverização, gel ou termonebulização dependendo do ambiente.
            </p>
          </div>

          <div className="servico-card">
            <div className="servico-icon"><ShieldCheck size={32} /></div>
            <h3>Descupinização</h3>
            <p>
              Proteção definitiva para seus móveis e madeiras estruturais. Barreiras químicas e injeção localizada para combater cupins de solo e madeira seca.
            </p>
          </div>

          <div className="servico-card">
            <div className="servico-icon"><Leaf size={32} /></div>
            <h3>Controle Integrado</h3>
            <p>
              Programas mensais preventivos para condomínios e restaurantes. Relatórios detalhados e certificados em conformidade com a Vigilância Sanitária.
            </p>
          </div>

        </div>
      </section>

      {/* ── CONTATO ── */}
      <section id="contato" className="section section-dark">
        <div className="contato-wrapper">
          <h2 className="section-title">Pronto para resolver seu problema?</h2>
          <p className="section-subtitle" style={{ color: '#94a3b8' }}>
            Nossa equipe técnica está pronta para avaliar seu caso e enviar um orçamento sem compromisso.
          </p>
          
          <div className="contato-info">
            <div className="info-item">
              <Phone className="icon" size={24} />
              <span>(11) 98765-4321</span>
            </div>
            <div className="info-item">
              <Mail className="icon" size={24} />
              <span>contato@protecta.com.br</span>
            </div>
            <div className="info-item">
              <MapPin className="icon" size={24} />
              <span>Av. Paulista, 1000 - São Paulo, SP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Protecta Ambiental. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}
