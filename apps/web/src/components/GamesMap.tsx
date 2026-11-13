import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../api";
import { formatWhen } from "./GameCard";
import type { GameCardData } from "../types";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FlyToGame({
  game,
  tick,
  markers,
}: {
  game: GameCardData | undefined;
  tick: number;
  markers: MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!game) return;
    map.flyTo([game.latitude, game.longitude], 14, { duration: 0.5 });
    const t = window.setTimeout(() => {
      markers.current[game.id]?.openPopup();
    }, 320);
    return () => window.clearTimeout(t);
  }, [game, tick, map, markers]);

  return null;
}

function MarkerPopup({
  game,
  onJoined,
}: {
  game: GameCardData;
  onJoined: (gameId: string, count: number) => void;
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const spots = game.maxParticipants - game.participantCount;

  async function join() {
    setErr("");
    setBusy(true);
    try {
      const r = await api<{ count: number }>(`/games/${game.id}/join`, { method: "POST" });
      onJoined(game.id, r.count);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm min-w-[170px]">
      <p className="font-medium">{game.sportName}</p>
      <p className="mt-1">{formatWhen(game.startsAt)}</p>
      <p className="text-slate-600 mb-2">
        {spots} {spots === 1 ? "spot" : "spots"} left
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || spots <= 0}
          onClick={join}
          className="bg-teal-700 text-white rounded px-2 py-1 text-xs disabled:opacity-50"
        >
          Join
        </button>
        <Link to={`/games/${game.id}`} className="border rounded px-2 py-1 text-xs">
          Details
        </Link>
      </div>
      {err && <p className="text-red-600 text-xs mt-1">{err}</p>}
    </div>
  );
}

export function GamesMap({
  games,
  selectedId,
  focusTick,
  onJoined,
}: {
  games: GameCardData[];
  selectedId: string | null;
  focusTick: number;
  onJoined: (gameId: string, count: number) => void;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const selected = games.find((g) => g.id === selectedId);
  const start = selected || games[0];
  const center: [number, number] = start ? [start.latitude, start.longitude] : [54.6872, 25.2797];

  return (
    <div className="h-full min-h-[280px] rounded-lg overflow-hidden border border-slate-300 shadow-sm">
      <MapContainer center={center} zoom={12} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToGame game={selected} tick={focusTick} markers={markerRefs} />
        {games.map((g) => (
          <Marker
            key={g.id}
            position={[g.latitude, g.longitude]}
            ref={(m) => {
              markerRefs.current[g.id] = m;
            }}
          >
            <Popup>
              <MarkerPopup game={g} onJoined={onJoined} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
