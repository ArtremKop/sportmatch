import { Link } from "react-router-dom";
import type { GameCardData } from "../types";

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cardClass(selected?: boolean) {
  if (selected) {
    return "block w-full text-left bg-teal-50 rounded-lg border-2 border-teal-600 p-4 shadow-md";
  }
  return "block w-full text-left bg-white rounded-lg border border-slate-300 p-4 shadow-sm hover:shadow-md hover:border-teal-500 hover:-translate-y-0.5 transition";
}

function CardBody({ game }: { game: GameCardData }) {
  const spots = game.maxParticipants - game.participantCount;
  return (
    <>
      <div className="flex justify-between gap-2 items-start">
        <div>
          <p className="font-medium">{game.sportName}</p>
          <p className="text-sm text-slate-500">{game.type === "ONE_ON_ONE" ? "1-on-1" : "Team"}</p>
        </div>
        <span className="text-xs bg-teal-50 text-teal-800 px-2 py-1 rounded border border-teal-100">
          {spots} {spots === 1 ? "spot" : "spots"} left
        </span>
      </div>
      <p className="mt-2 text-sm">{formatWhen(game.startsAt)}</p>
      <p className="text-sm text-slate-600">{game.locationName}</p>
      <p className="text-xs text-slate-500 mt-1">Host: {game.organizerName}</p>
    </>
  );
}

type Props = {
  game: GameCardData;
  selected?: boolean;
  onSelect?: () => void;
};

export function GameCard({ game, selected, onSelect }: Props) {
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={cardClass(selected)}>
        <CardBody game={game} />
      </button>
    );
  }

  return (
    <Link to={`/games/${game.id}`} className={cardClass()}>
      <CardBody game={game} />
    </Link>
  );
}
