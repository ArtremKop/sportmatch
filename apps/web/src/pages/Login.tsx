import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto px-3 py-10">
      <p className="text-teal-700 font-semibold">SportMatch</p>
      <h1 className="text-2xl font-semibold mt-1 mb-2">Log in</h1>
      <p className="text-slate-600 text-sm mb-6">
        Find and join amateur sports games near you. Host a 1-on-1 or a team lobby, or jump into a match that still has spots.
      </p>
      <form onSubmit={onSubmit} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-teal-700 text-white rounded py-2">Log in</button>
      </form>
      <p className="text-sm mt-4 text-slate-600">
        No account? <Link to="/register" className="text-teal-700">Register</Link>
      </p>
    </div>
  );
}
