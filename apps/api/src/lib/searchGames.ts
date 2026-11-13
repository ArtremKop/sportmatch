import { Prisma, prisma } from "db";

export async function searchGames(q: {
  sportId?: string;
  from?: Date;
  to?: Date;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  onlyOpen?: boolean;
}) {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (q.sportId) parts.push(Prisma.sql`g."sportId" = ${q.sportId}`);
  if (q.from) parts.push(Prisma.sql`g."startsAt" >= ${q.from}`);
  if (q.to) parts.push(Prisma.sql`g."startsAt" <= ${q.to}`);

  if (q.onlyOpen !== false) {
    parts.push(Prisma.sql`g.status = 'OPEN'`);
    parts.push(Prisma.sql`g."startsAt" > NOW()`);
    parts.push(Prisma.sql`g."maxParticipants" > (
      SELECT COUNT(*) FROM "GameParticipant" p WHERE p."gameId" = g.id
    )`);
  }

  if (q.lat != null && q.lng != null && q.radiusKm != null) {
    const meters = q.radiusKm * 1000;
    parts.push(Prisma.sql`ST_DWithin(
      g.location,
      ST_SetSRID(ST_MakePoint(${q.lng}, ${q.lat}), 4326)::geography,
      ${meters}
    )`);
  }

  const where = Prisma.join(parts, " AND ");

  return prisma.$queryRaw<
    Array<{
      id: string;
      type: string;
      status: string;
      sportId: string;
      startsAt: Date;
      locationName: string;
      latitude: number;
      longitude: number;
      maxParticipants: number;
      skillPref: string | null;
      notes: string | null;
      organizerId: string;
      sportName: string;
      organizerName: string;
      participantCount: number;
    }>
  >`
    SELECT
      g.id,
      g.type,
      g.status,
      g."sportId",
      g."startsAt",
      g."locationName",
      g.latitude,
      g.longitude,
      g."maxParticipants",
      g."skillPref",
      g.notes,
      g."organizerId",
      s.name as "sportName",
      u.name as "organizerName",
      (SELECT COUNT(*)::int FROM "GameParticipant" p WHERE p."gameId" = g.id) as "participantCount"
    FROM "Game" g
    JOIN "Sport" s ON s.id = g."sportId"
    JOIN "User" u ON u.id = g."organizerId"
    WHERE ${where}
    ORDER BY g."startsAt" ASC
  `;
}
