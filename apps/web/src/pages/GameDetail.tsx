import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { getSocket } from "../socket";
import { useAuth } from "../auth";
import { Chat } from "../components/Chat";
import { MapPicker } from "../components/MapPicker";
import { formatWhen } from "../components/GameCard";
import type { GameCardData } from "../types";

export function GameDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [game, setGame] = useState<GameCardData | null>(null);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");

  async function load() {
    const r = await api<{ game: GameCardData }>(`/games/${id}`);
    setGame(r.game);
    setCount(r.game.participantCount);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const s = getSocket();
    if (!s) return;
    const onCount = (p: { gameId: string; count: number }) => {
      if (p.gameId === id) setCount(p.count);
    };
    const onCancel = (p: { gameId: string }) => {
      if (p.gameId === id) load();
    };
    s.on("participants", onCount);
    s.on("gameCancelled", onCancel);
    s.emit("joinGameRoom", id);
    return () => {
      s.off("participants", onCount);
      s.off("gameCancelled", onCancel);
    };
  }, [id]);

  if (!game) {
    return <p className="p-4">{err || "Loading..."}</p>;
  }

  const inGame = game.participants?.some((p) => p.id === user?.id);
  const isHost = game.organizerId === user?.id;
  const full = count >= game.maxParticipants;
  const past = new Date(game.startsAt).getTime() <= Date.now();
  const open = game.status === "OPEN" && !past;

  async function join() {
    setErr("");
    try {
      const r = await api<{ count: number }>(`/games/${id}/join`, { method: "POST" });
      setCount(r.count);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Join failed");
    }
  }

  async function leave() {
    setErr("");
    try {
      const r = await api<{ count: number }>(`/games/${id}/leave`, { method: "DELETE" });
      setCount(r.count);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Leave failed");
    }
  }

  async function cancel() {
    if (!confirm("Cancel this game?")) return;
    try {
      await api(`/games/${id}`, { method: "DELETE" });
      nav("/my-games");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-3 py-6 space-y-4">
      <div className="flex justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">{game.sportName}</h1>
        {game.status === "CANCELLED" && (
          <span className="text-red-600 text-sm self-center">Cancelled</span>
        )}
      </div>
      <p className="text-slate-600">{game.type === "ONE_ON_ONE" ? "1-on-1" : "Team lobby"}</p>
      <p>{formatWhen(game.startsAt)}</p>
      <p>{game.locationName}</p>
      {game.skillPref && <p className="text-sm">Preferred skill: {game.skillPref.toLowerCase()}</p>}
      {game.notes && <p className="text-sm bg-white border rounded p-3">{game.notes}</p>}
      <p className="font-medium">
        Players: {count} / {game.maxParticipants}
      </p>
      <ul className="text-sm text-slate-700 list-disc pl-5">
        {game.participants?.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === game.organizerId ? " (host)" : ""}
          </li>
        ))}
      </ul>
      <MapPicker lat={game.latitude} lng={game.longitude} />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        {open && !inGame && (
          <button disabled={full} onClick={join} className="bg-teal-700 text-white rounded py-2 px-4 disabled:opacity-50">
            {full ? "Full" : "Join"}
          </button>
        )}
        {open && inGame && !isHost && (
          <button onClick={leave} className="border rounded py-2 px-4">
            Leave
          </button>
        )}
        {open && isHost && (
          <>
            <Link to={`/games/${game.id}/edit`} className="border rounded py-2 px-4 text-center">
              Edit
            </Link>
            <button onClick={cancel} className="border border-red-300 text-red-700 rounded py-2 px-4">
              Cancel game
            </button>
          </>
        )}
      </div>
      {inGame && game.status !== "CANCELLED" ? (
        <Chat gameId={game.id} />
      ) : (
        <p className="text-sm text-slate-500">Join the game to use the chat.</p>
      )}
    </div>
  );
}
