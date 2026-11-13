import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-3 py-3 flex items-center gap-3 flex-wrap">
        <Link to="/" className="font-semibold text-teal-700 text-lg">
          SportMatch
        </Link>
        {user && (
          <nav className="flex gap-3 text-sm flex-1">
            <NavLink to="/" className={({ isActive }) => (isActive ? "text-teal-700" : "text-slate-600")}>
              Find
            </NavLink>
            <NavLink to="/games/new" className={({ isActive }) => (isActive ? "text-teal-700" : "text-slate-600")}>
              Create
            </NavLink>
            <NavLink to="/my-games" className={({ isActive }) => (isActive ? "text-teal-700" : "text-slate-600")}>
              My games
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? "text-teal-700" : "text-slate-600")}>
              Profile
            </NavLink>
          </nav>
        )}
        <div className="ml-auto text-sm">
          {user ? (
            <button onClick={logout} className="text-slate-600 hover:text-slate-900">
              Log out
            </button>
          ) : (
            <Link to="/login" className="text-teal-700">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
