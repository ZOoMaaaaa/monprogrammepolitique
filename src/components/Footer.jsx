import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <span className="footer-brand">🇫🇷 Mon Programme Politique</span>
          <span className="footer-sep">·</span>
          <span className="footer-copy">© {new Date().getFullYear()} — Plateforme citoyenne</span>
          <span className="footer-sep">·</span>
          <a className="footer-site-link" href="https://wappydev.fr" target="_blank" rel="noopener noreferrer">Développé par Wappydev</a>
        </div>
        <div className="footer-links">
          <button className="footer-legal-link" onClick={() => navigate('/legal/mentions')}>Mentions légales</button>
          <span className="footer-sep">·</span>
          <button className="footer-legal-link" onClick={() => navigate('/legal/confidentialite')}>Politique de confidentialité</button>
          <span className="footer-sep">·</span>
          <button className="footer-legal-link" onClick={() => navigate('/legal/cgu')}>CGU</button>
        </div>
      </div>
    </footer>
  )
}
