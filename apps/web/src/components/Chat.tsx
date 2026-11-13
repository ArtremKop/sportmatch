import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { getSocket } from "../socket";
import { useAuth } from "../auth";
import type { ChatMsg } from "../types";

export function Chat({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ messages: ChatMsg[] }>(`/games/${gameId}/messages`).then((r) => setMsgs(r.messages));

    const s = getSocket();
    if (!s) return;
    s.emit("joinGameRoom", gameId);
    const onMsg = (m: ChatMsg & { gameId?: string }) => {
      if (m.gameId && m.gameId !== gameId) return;
      setMsgs((prev) => [...prev, m]);
    };
    s.on("chat:message", onMsg);
    return () => {
      s.off("chat:message", onMsg);
      s.emit("leaveGameRoom", gameId);
    };
  }, [gameId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    getSocket()?.emit("chat:send", { gameId, text: t });
    setText("");
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-80">
      <div className="px-3 py-2 border-b text-sm font-medium">Chat</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {msgs.length === 0 && <p className="text-slate-400">No messages yet</p>}
        {msgs.map((m) => (
          <div key={m.id} className={m.userId === user?.id ? "text-right" : ""}>
            <p className="text-xs text-slate-500">{m.userName}</p>
            <p className="inline-block bg-slate-100 rounded px-2 py-1">{m.text}</p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex border-t">
        <input
          className="flex-1 px-3 py-2 text-sm outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
        />
        <button className="px-3 text-teal-700 text-sm font-medium" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
