import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { MapPicker } from "../components/MapPicker";
import type { Sport } from "../types";

function localInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function CreateGame() {
  const nav = useNavigate();
  const [sports, setSports] = useState<Sport[]>([]);
  const [type, setType] = useState<"ONE_ON_ONE" | "TEAM">("TEAM");
  const [sportId, setSportId] = useState("");
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0);
    return localInput(d);
  });
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState(54.6872);
  const [lng, setLng] = useState(25.2797);
  const [maxParticipants, setMax] = useState(10);
  const [skillPref, setSkill] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ sports: Sport[] }>("/sports").then((r) => {
      setSports(r.sports);
      if (r.sports[0]) setSportId(r.sports[0].id);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const r = await api<{ game: { id: string } }>("/games", {
        method: "POST",
        body: JSON.stringify({
          type,
          sportId,
          startsAt: new Date(startsAt).toISOString(),
          locationName,
          latitude: lat,
          longitude: lng,
          maxParticipants: type === "TEAM" ? Number(maxParticipants) : 2,
          skillPref: skillPref || null,
          notes: notes || undefined,
        }),
      });
      nav(`/games/${r.game.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create");
    }
  }

  return (
    <div className="max-w-xl mx-auto px-3 py-6">
      <h1 className="text-2xl font-semibold mb-4">New game</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded py-2 border ${type === "TEAM" ? "bg-teal-700 text-white" : "bg-white"}`}
            onClick={() => setType("TEAM")}
          >
            Team
          </button>
          <button
            type="button"
            className={`flex-1 rounded py-2 border ${type === "ONE_ON_ONE" ? "bg-teal-700 text-white" : "bg-white"}`}
            onClick={() => setType("ONE_ON_ONE")}
          >
            1-on-1
          </button>
        </div>
        <select className="w-full border rounded px-3 py-2" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Place name (park, court...)"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          required
        />
        <p className="text-sm text-slate-500">Click the map to set the location</p>
        <MapPicker lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
        {type === "TEAM" && (
          <label className="block text-sm">
            Max players
            <input
              type="number"
              min={3}
              max={50}
              className="w-full border rounded px-3 py-2 mt-1"
              value={maxParticipants}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </label>
        )}
        <select className="w-full border rounded px-3 py-2" value={skillPref} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Any skill</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-teal-700 text-white rounded py-2">Create</button>
      </form>
    </div>
  );
}
