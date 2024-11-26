import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="navbar bg-background text-text">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl normal-case text-primary">Environmental Monitoring</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal p-0">
          <li><Link to="/reports" className="text-text">Reports</Link></li>
          <li><Link to="/login" className="text-text">Login</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;