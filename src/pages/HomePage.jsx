import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_PATH } from '../roles';

// ---------------------------------------------------------------------------
// EDIT ME: add/remove/change the cards below to link out to your other
// websites. `image` can be any image URL (or a path under /public, e.g.
// "/my-image.png"). If you leave `image` blank, a placeholder graphic is
// shown instead so the layout still looks right until you add real images.
// ---------------------------------------------------------------------------
const EXTERNAL_LINKS = [
  {
    title: 'Company Website',
    description: 'Visit our main corporate website for products, pricing, and company news.',
    url: 'https://example.com',
    image: '',
  },
  {
    title: 'Support Portal',
    description: 'Raise a ticket or browse help articles on our customer support site.',
    url: 'https://example.com',
    image: '',
  },
  {
    title: 'Product Catalog',
    description: 'Browse our full range of products and specifications.',
    url: 'https://example.com',
    image: '',
  },
];

// Generates a simple placeholder graphic (as an inline SVG data URI) for any
// card that doesn't have a real image set yet, so the page never looks broken.
function placeholderImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="270">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4338ca"/>
          <stop offset="100%" stop-color="#0ea5a5"/>
        </linearGradient>
      </defs>
      <rect width="480" height="270" fill="url(#g)"/>
      <text x="50%" y="50%" font-family="Segoe UI, sans-serif" font-size="28" font-weight="700"
            fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-shell">
      <div className="home-nav">
        <div className="brand">
          <div className="brand-mark">DSR</div>
          <div className="brand-name">DSR Customer Management System</div>
        </div>
        <div className="home-nav-actions">
          {user ? (
            <Link className="btn btn-primary btn-sm" to={DASHBOARD_PATH[user.role] || '/login'}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-outline btn-sm" to="/login">
                Log In
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="home-hero">
        <h1>DSR Customer Management System</h1>
        <p>
          Manage Zones, Branches, and your Regional Managers, Branch Heads, Technicians, and Salespersons — all
          customer visit data in one place.
        </p>
        {!user && (
          <div className="home-hero-actions">
            <Link className="btn btn-primary" to="/register">
              Create an Account
            </Link>
            <Link className="btn btn-outline" to="/login">
              Log In
            </Link>
          </div>
        )}
      </div>

      <div className="home-links-section">
        <h2>Quick Links</h2>
        <p className="home-links-subtitle">Useful links to our other sites and resources.</p>

        <div className="home-links-grid">
          {EXTERNAL_LINKS.map((link) => (
            <a key={link.title} className="home-link-card" href={link.url} target="_blank" rel="noopener noreferrer">
              <img src={link.image || placeholderImage(link.title)} alt={link.title} />
              <div className="home-link-card-body">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <span className="home-link-cta">Visit site →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="home-footer">DSR Customer Management System</div>
    </div>
  );
}
