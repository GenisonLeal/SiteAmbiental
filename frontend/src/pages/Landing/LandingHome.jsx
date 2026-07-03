import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Bug, ShieldCheck, Phone, Mail, MapPin, Ghost, Droplets, Menu, X, Copy, Check } from 'lucide-react';
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import nossahistoriaImg from '../../assets/images/nossahistoria.png';
import './Landing.css';

import ServicoDetalheModal from '../../components/Modal/ServicoDetalheModal';

// ── Dados de Contato (centralizados para manutenção fácil) ──
const CONTATO = {
  telefone: '(92) 98485-1809',
  telefoneLimpo: '5592984851809',
  email: 'protectaambiental7@gmail.com',
  endereco: 'Manaus, AM',
  enderecoMaps: 'https://www.google.com/maps/search/Manaus+AM',
  instagram: 'https://www.instagram.com/protectaambiental',
  facebook: 'https://www.facebook.com/protectaambiental',
  whatsapp: 'https://wa.me/5592984851809',
};

// Array de Dados dos Serviços
const servicosEspecialidades = [
  {
    id: 'dedetizacao',
    icon: Bug,
    title: 'Desinsetização (Dedetização)',
    description: 'Controle eficaz de baratas, formigas, moscas, mosquitos e outros insetos rasteiros e voadores.',
    details: [
      'Aplicação de gel inodoro e invisível em áreas sensíveis (cozinhas, painéis elétricos).',
      'Pulverização de efeito residual em rodapés e cantos escuros.',
      'Controle de vetores de doenças para ambientes residenciais, industriais e alimentícios.',
      'Tratamento preventivo e corretivo (infestações ativas).'
    ]
  },
  {
    id: 'desratizacao',
    icon: Ghost,
    title: 'Desratização',
    description: 'Estratégias avançadas para eliminação e controle de roedores, garantindo a higiene e segurança.',
    details: [
      'Mapeamento estratégico e identificação de rotas e ninhos.',
      'Instalação de Porta-Iscas de segurança (evita contato com cães/gatos e crianças).',
      'Uso de raticidas de dose única (anticoagulantes modernos) com ação disfarçada.',
      'Monitoramento periódico e selamento de vias de acesso estruturais.'
    ]
  },
  {
    id: 'descupinizacao',
    icon: ShieldCheck,
    title: 'Descupinização',
    description: 'Proteção definitiva para seus móveis e madeiras estruturais com barreiras químicas.',
    details: [
      'Tratamento focado para Cupim de Madeira Seca (injeção em furos na madeira).',
      'Tratamento em solo/barreira química para Cupins Subterrâneos (brocas ao redor do imóvel).',
      'Pincelamento preventivo em estruturas de telhados antes da construção.',
      'Garantia estendida contra retorno das colônias.'
    ]
  },
  {
    id: 'higienizacao',
    icon: Droplets,
    title: 'Higienização de Reservatórios',
    description: 'Limpeza e desinfecção de caixas d\'água para garantir a qualidade da água consumida.',
    details: [
      'Remoção completa de biofilme, algas, lama e minerais sedimentados nas paredes.',
      'Desinfecção rigorosa com pastilhas de cloro ativo estabilizado.',
      'Fornecimento de Certificado/Laudo Técnico de Limpeza (exigido pela Vigilância Sanitária).',
      'Recomendação obrigatória de repetição a cada 6 meses.'
    ]
  }
];

// Componente Interativo de Partículas (Canvas)
function ParticlesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: undefined, y: undefined, radius: 120 };

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      initParticles();
    };

    class Particle {
      constructor(x, y) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 3;
        this.angle = Math.random() * Math.PI * 2;
        this.density = (Math.random() * 20) + 1;
        this.color = '#065f46';
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-this.size / 2, -1, this.size, 2);
        ctx.restore();
      }
      update() {
        if (mouse.x !== undefined && mouse.y !== undefined) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = mouse.radius;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;

          if (distance < mouse.radius) {
            this.x += directionX;
            this.y += directionY;
          } else {
            if (this.x !== this.baseX) {
              this.x -= (this.x - this.baseX) / 20;
            }
            if (this.y !== this.baseY) {
              this.y -= (this.y - this.baseY) / 20;
            }
          }
        } else {
          if (this.x !== this.baseX) {
            this.x -= (this.x - this.baseX) / 20;
          }
          if (this.y !== this.baseY) {
            this.y -= (this.y - this.baseY) / 20;
          }
        }
        this.draw();
      }
    }

    const initParticles = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 3000;
      for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
      } else {
        mouse.x = undefined;
        mouse.y = undefined;
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}

export default function LandingHome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const openServiceModal = (servico) => {
    setSelectedService(servico);
  };

  const closeServiceModal = () => {
    setSelectedService(null);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="landing-container" data-theme="light">
      
      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <Leaf size={28} />
          Protecta Ambiental
        </div>
        
        <button className="landing-mobile-btn" onClick={toggleMenu}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#empresa" onClick={closeMenu}>A Empresa</a>
          <a href="#servicos" onClick={closeMenu}>Serviços</a>
          <a href="#contato" onClick={closeMenu}>Contato</a>
          <Link to="/login" className="btn-login-nav" onClick={closeMenu}>Área do Cliente</Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section id="home" className="hero-section">
        <ParticlesBackground />
        
        <div className="hero-content">
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
        </div>
      </section>

      {/* ── EMPRESA ── */}
      <section id="empresa" className="section">
        <div className="empresa-content">
          <img src={nossahistoriaImg} alt="Nossa História - Protecta Ambiental" className="empresa-image" />
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
        <p className="section-subtitle">Técnicas avançadas para cada tipo de necessidade. Selecione para ver mais detalhes.</p>
        
        <div className="servicos-grid">
          {servicosEspecialidades.map((servico) => (
            <div 
              key={servico.id} 
              className="servico-card clickable"
              onClick={() => openServiceModal(servico)}
            >
              <div className="servico-icon"><servico.icon size={32} /></div>
              <h3>{servico.title}</h3>
              <p>{servico.description}</p>
              <div className="servico-action">
                <span className="servico-link">Ver Detalhes</span>
              </div>
            </div>
          ))}
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
            {/* Telefone: link tel: no mobile, copiar em qualquer tela */}
            <div className="info-item">
              <Phone className="icon" size={24} />
              <a href={`tel:+${CONTATO.telefoneLimpo}`} className="info-link mobile-only-link">
                {CONTATO.telefone}
              </a>
              <span className="info-text desktop-only-text">{CONTATO.telefone}</span>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy(CONTATO.telefone, 'telefone')}
                title="Copiar telefone"
              >
                {copiedField === 'telefone' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Email: abre Gmail compose ao clicar, e permite copiar */}
            <div className="info-item">
              <a 
                href={`https://mail.google.com/mail/?view=cm&to=${CONTATO.email}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
                title="Enviar e-mail pelo Gmail"
              >
                <Mail className="icon" size={24} />
              </a>
              <a 
                href={`https://mail.google.com/mail/?view=cm&to=${CONTATO.email}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                {CONTATO.email}
              </a>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy(CONTATO.email, 'email')}
                title="Copiar e-mail"
              >
                {copiedField === 'email' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Endereço: abre Google Maps ao clicar, e permite copiar */}
            <div className="info-item">
              <a href={CONTATO.enderecoMaps} target="_blank" rel="noopener noreferrer" className="info-link" title="Abrir no Google Maps">
                <MapPin className="icon" size={24} />
              </a>
              <a href={CONTATO.enderecoMaps} target="_blank" rel="noopener noreferrer" className="info-link">
                {CONTATO.endereco}
              </a>
              <button 
                className="copy-btn" 
                onClick={() => handleCopy(CONTATO.endereco, 'endereco')}
                title="Copiar endereço"
              >
                {copiedField === 'endereco' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-socials">
          <a href={CONTATO.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram"><FaInstagram size={24} /></a>
          <a href={CONTATO.facebook} target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook"><FaFacebook size={24} /></a>
          <a href={CONTATO.whatsapp} target="_blank" rel="noopener noreferrer" className="social-icon" title="WhatsApp"><FaWhatsapp size={24} /></a>
        </div>
        <p>© {new Date().getFullYear()} Protecta Ambiental. Todos os direitos reservados.</p>
      </footer>

      {/* ── MODAL DE DETALHES DOS SERVIÇOS ── */}
      <ServicoDetalheModal 
        isOpen={!!selectedService} 
        onClose={closeServiceModal} 
        servico={selectedService} 
      />

    </div>
  );
}
