export type Skill = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type User = {
  id: string;
  email: string;
  name: string;
  city: string | null;
  sports?: { sportId: string; name: string; skill: Skill | null }[];
};

export type Sport = { id: string; name: string };

export type GameCardData = {
  id: string;
  type: "ONE_ON_ONE" | "TEAM";
  status: "OPEN" | "CANCELLED" | "STARTED";
  sportId: string;
  sportName: string;
  startsAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  maxParticipants: number;
  skillPref: Skill | null;
  notes: string | null;
  organizerId: string;
  organizerName: string;
  participantCount: number;
  participants?: { id: string; name: string }[];
};

export type ChatMsg = {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
};
