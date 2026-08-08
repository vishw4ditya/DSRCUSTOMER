import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../roles';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="brand">
        <img src="/company-logo.jpg" alt="Karnali Krishna Purifier Pvt. Ltd." className="navbar-logo-img" />
        <div className="brand-name">DSR Customer Management System</div>
      </div>
      {user && (
        <div className="nav-user">
          <span className="user-id">{user.userId}</span>
          <span className="role-pill">{ROLE_LABELS[user.role] || user.role}</span>
          <button className="nav-link-btn" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="nav-link-btn" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button className="nav-link-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
