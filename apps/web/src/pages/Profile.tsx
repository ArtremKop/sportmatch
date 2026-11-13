import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Skill, Sport, User } from "../types";

const skills: { value: Skill | ""; label: string }[] = [
  { value: "", label: "No level" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function Profile() {
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [picked, setPicked] = useState<Record<string, Skill | "">>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api<{ sports: Sport[] }>("/sports"), api<{ user: User }>("/users/me")]).then(
      ([s, me]) => {
        setSports(s.sports);
        setName(me.user.name);
        setCity(me.user.city || "");
        const map: Record<string, Skill | ""> = {};
        me.user.sports?.forEach((x) => {
          map[x.sportId] = x.skill || "";
        });
        setPicked(map);
      }
    );
  }, []);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const r = await api<{ user: User }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          city: city || null,
          sports: Object.entries(picked).map(([sportId, skill]) => ({
            sportId,
            skill: skill || null,
          })),
        }),
      });
      setUser(r.user);
      setMsg("Saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-3 py-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <form onSubmit={save} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="City (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <p className="font-medium pt-2">Sports</p>
        <div className="space-y-2">
          {sports.map((s) => (
            <div key={s.id} className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 min-w-[140px]">
                <input type="checkbox" checked={s.id in picked} onChange={() => toggle(s.id)} />
                {s.name}
              </label>
              {s.id in picked && (
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={picked[s.id]}
                  onChange={(e) => setPicked({ ...picked, [s.id]: e.target.value as Skill | "" })}
                >
                  {skills.map((sk) => (
                    <option key={sk.label} value={sk.value}>
                      {sk.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        {msg && <p className="text-teal-700 text-sm">{msg}</p>}
        <button className="w-full bg-teal-700 text-white rounded py-2">Save</button>
      </form>
    </div>
  );
}
