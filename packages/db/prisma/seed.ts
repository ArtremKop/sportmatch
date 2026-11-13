import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const names = [
    "Football",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Running",
    "Table tennis",
  ];

  for (const name of names) {
    await prisma.sport.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const hash = await bcrypt.hash("demo1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@sports.local" },
    update: {},
    create: {
      email: "demo@sports.local",
      passwordHash: hash,
      name: "Demo Player",
      city: "Vilnius",
    },
  });

  const other = await prisma.user.upsert({
    where: { email: "alex@sports.local" },
    update: {},
    create: {
      email: "alex@sports.local",
      passwordHash: hash,
      name: "Alex",
      city: "Vilnius",
    },
  });

  const football = await prisma.sport.findUniqueOrThrow({ where: { name: "Football" } });
  const tennis = await prisma.sport.findUniqueOrThrow({ where: { name: "Tennis" } });

  await prisma.userSport.upsert({
    where: { userId_sportId: { userId: demo.id, sportId: football.id } },
    update: {},
    create: { userId: demo.id, sportId: football.id, skill: "INTERMEDIATE" },
  });

  const already = await prisma.game.count({ where: { organizerId: demo.id } });
  if (already === 0) {
    const starts = new Date();
    starts.setDate(starts.getDate() + 3);
    starts.setHours(18, 0, 0, 0);

    await prisma.game.create({
      data: {
        type: "TEAM",
        sportId: football.id,
        startsAt: starts,
        locationName: "Vingis Park, Vilnius",
        latitude: 54.6833,
        longitude: 25.2378,
        maxParticipants: 10,
        skillPref: "INTERMEDIATE",
        notes: "Bring a ball if you have one",
        organizerId: demo.id,
        participants: { create: { userId: demo.id } },
      },
    });

    const tennisStart = new Date();
    tennisStart.setDate(tennisStart.getDate() + 1);
    tennisStart.setHours(17, 30, 0, 0);

    await prisma.game.create({
      data: {
        type: "ONE_ON_ONE",
        sportId: tennis.id,
        startsAt: tennisStart,
        locationName: "SEB Arena outdoor courts",
        latitude: 54.7092,
        longitude: 25.2977,
        maxParticipants: 2,
        organizerId: other.id,
        participants: { create: { userId: other.id } },
      },
    });
  }

  console.log("Seed done. Demo login: demo@sports.local / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
