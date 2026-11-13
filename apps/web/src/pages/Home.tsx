import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { GameCard } from "../components/GameCard";
import { GamesMap } from "../components/GamesMap";
import type { GameCardData, Sport } from "../types";

export function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [games, setGames] = useState<GameCardData[]>([]);
  const [sportId, setSportId] = useState("");
  const [from, setFrom] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState("10");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    api<{ sports: Sport[] }>("/sports").then((r) => setSports(r.sports));
    load();
  }, []);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setErr("");
    const q = new URLSearchParams();
    if (sportId) q.set("sportId", sportId);
    if (from) q.set("from", new Date(from).toISOString());
    if (lat != null && lng != null) {
      q.set("lat", String(lat));
      q.set("lng", String(lng));
      q.set("radiusKm", radiusKm || "10");
    }
    try {
      const r = await api<{ games: GameCardData[] }>(`/games?${q.toString()}`);
      setGames(r.games);
      setSelectedId((prev) => {
        if (prev && r.games.some((g) => g.id === prev)) return prev;
        return r.games[0]?.id ?? null;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setErr("Could not get location")
    );
  }

  function selectGame(id: string) {
    setSelectedId(id);
    setFocusTick((n) => n + 1);
  }

  function onJoined(gameId: string, count: number) {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, participantCount: count } : g))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-6">
      <h1 className="text-2xl font-semibold mb-4">Open games</h1>
      <form onSubmit={load} className="bg-white border rounded-lg p-3 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className="border rounded px-2 py-2" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="border rounded px-2 py-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-2 w-24"
            type="number"
            min={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            title="Radius km"
          />
          <button type="button" onClick={useMyLocation} className="border rounded px-2 py-2 text-sm flex-1">
            {lat != null ? "Location set" : "Use my location"}
          </button>
        </div>
        <button className="bg-teal-700 text-white rounded py-2" type="submit">
          Search
        </button>
      </form>
      {lat != null && lng != null && (
        <p className="text-xs text-slate-500 mb-3">
          Filtering within {radiusKm} km of {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      )}
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
      {loading && <p className="text-sm text-slate-500 mb-2">Loading...</p>}

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
          {games.length === 0 && !loading && <p className="text-slate-500">No games match the filters.</p>}
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              selected={g.id === selectedId}
              onSelect={() => selectGame(g.id)}
            />
          ))}
        </div>
        <div className="h-[50vh] lg:h-[70vh] lg:sticky lg:top-3">
          <GamesMap
            games={games}
            selectedId={selectedId}
            focusTick={focusTick}
            onJoined={onJoined}
          />
        </div>
      </div>
    </div>
  );
}
