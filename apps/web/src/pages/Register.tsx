import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await register(name, email, password);
      nav("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not register");
    }
  }

  return (
    <div className="max-w-md mx-auto px-3 py-10">
      <p className="text-teal-700 font-semibold">SportMatch</p>
      <h1 className="text-2xl font-semibold mt-1 mb-2">Create account</h1>
      <p className="text-slate-600 text-sm mb-6">
        Find and join amateur sports games near you. Sign up to create matches, search by sport and distance, and chat with other players.
      </p>
      <form onSubmit={onSubmit} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          placeholder="Password (min 6)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-teal-700 text-white rounded py-2">Register</button>
      </form>
      <p className="text-sm mt-4 text-slate-600">
        Already have an account? <Link to="/login" className="text-teal-700">Log in</Link>
      </p>
    </div>
  );
}
