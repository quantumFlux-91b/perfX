import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="glass-panel app-nav">
      <div className="app-nav-brand">
        <div className="app-nav-logo">
          <span className="app-nav-logo-text">PX</span>
        </div>
        <h1 className="app-nav-title">PerfX</h1>
      </div>
      <div className="app-nav-links">
        <Link to="/applications" className="app-nav-link">Applications</Link>
        <Link to="/" className="btn btn-glass app-nav-logout">Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
