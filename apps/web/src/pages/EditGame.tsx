import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { MapPicker } from "../components/MapPicker";
import type { GameCardData, Sport } from "../types";

function localInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function EditGame() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sports, setSports] = useState<Sport[]>([]);
  const [game, setGame] = useState<GameCardData | null>(null);
  const [sportId, setSportId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState(54.6872);
  const [lng, setLng] = useState(25.2797);
  const [maxParticipants, setMax] = useState(10);
  const [skillPref, setSkill] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ sports: Sport[] }>("/sports").then((r) => setSports(r.sports));
    api<{ game: GameCardData }>(`/games/${id}`).then((r) => {
      setGame(r.game);
      setSportId(r.game.sportId);
      setStartsAt(localInput(r.game.startsAt));
      setLocationName(r.game.locationName);
      setLat(r.game.latitude);
      setLng(r.game.longitude);
      setMax(r.game.maxParticipants);
      setSkill(r.game.skillPref || "");
      setNotes(r.game.notes || "");
    });
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api(`/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sportId,
          startsAt: new Date(startsAt).toISOString(),
          locationName,
          latitude: lat,
          longitude: lng,
          maxParticipants: game?.type === "TEAM" ? Number(maxParticipants) : 2,
          skillPref: skillPref || null,
          notes,
        }),
      });
      nav(`/games/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    }
  }

  if (!game) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto px-3 py-6">
      <h1 className="text-2xl font-semibold mb-4">Edit game</h1>
      <form onSubmit={onSubmit} className="space-y-3">
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
        />
        <input
          className="w-full border rounded px-3 py-2"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
        <MapPicker lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
        {game.type === "TEAM" && (
          <label className="block text-sm">
            Max players
            <input
              type="number"
              min={3}
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
        <textarea className="w-full border rounded px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full bg-teal-700 text-white rounded py-2">Save</button>
      </form>
    </div>
  );
}
