import { useEffect, useState } from "react";
import { api } from "../api";
import { GameCard } from "../components/GameCard";
import type { GameCardData } from "../types";

export function MyGames() {
  const [games, setGames] = useState<GameCardData[]>([]);

  useEffect(() => {
    api<{ games: GameCardData[] }>("/games/mine").then((r) => setGames(r.games));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-3 py-6">
      <h1 className="text-2xl font-semibold mb-4">My games</h1>
      {games.length === 0 && <p className="text-slate-500">You haven't joined any games yet.</p>}
      <div className="space-y-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
