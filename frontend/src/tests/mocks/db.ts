import type { IAuthUser } from "@/schemas/auth-schema";
import type { ISpecialistCard } from "@/schemas/match-schema";
import type { ISpecialist, ISpecialistOptions } from "@/schemas/specialist-schema";

// In-memory backend shared by the MSW handlers (tests and browser mocking).
// Tests call resetDb() after each case; in the browser it resets on reload.

export const seedUser: IAuthUser = { username: "demo" };
export const DEMO_PASSWORD = "demo-password";

export const options: ISpecialistOptions = {
  roles: [
    { id: "role-1", name: "Licensed Psychologist" },
    { id: "role-2", name: "Registered Clinical Counsellor" },
  ],
  sessionFormats: [
    { id: "format-1", name: "In-Person" },
    { id: "format-2", name: "Telehealth" },
  ],
  areasPractice: [
    { id: "area-1", name: "Anxiety and OCD" },
    { id: "area-2", name: "Children and Youth" },
    { id: "area-3", name: "ADHD" },
  ],
  credentials: [
    { id: "cred-1", name: "BCACC" },
    { id: "cred-2", name: "BCPA" },
  ],
};

const [psychologist, counsellor] = options.roles;
const [inPerson, telehealth] = options.sessionFormats;
const [anxiety, children, adhd] = options.areasPractice;
const [bcacc, bcpa] = options.credentials;

function seedSpecialists(): ISpecialist[] {
  return [
    {
      id: "spec-1",
      name: "John Whitaker",
      role: psychologist,
      description: "Works with adults facing anxiety and OCD.",
      bookingUrl: "#",
      profileUrl: "#",
      photoUrl: null,
      sessionFormats: [inPerson, telehealth],
      areasPractice: [anxiety],
      credentials: [bcpa],
    },
    {
      id: "spec-2",
      name: "Priya Raman",
      role: counsellor,
      description: "Helps children and teens with worry and attention difficulties.",
      bookingUrl: "#",
      profileUrl: "#",
      photoUrl: null,
      sessionFormats: [inPerson],
      areasPractice: [children, adhd],
      credentials: [bcacc],
    },
  ];
}

export function toCard(specialist: ISpecialist): ISpecialistCard {
  const names = (list: { name: string }[]) => list.map((item) => item.name);
  return {
    id: specialist.id,
    name: specialist.name,
    role: specialist.role.name,
    description: specialist.description,
    sessionFormats: names(specialist.sessionFormats),
    areasPractice: names(specialist.areasPractice),
    credentials: names(specialist.credentials),
    bookingUrl: specialist.bookingUrl,
    profileUrl: specialist.profileUrl,
  };
}

interface IDb {
  // null means "no session": GET /me answers 401.
  user: IAuthUser | null;
  specialists: ISpecialist[];
}

export const db: IDb = {
  user: null,
  specialists: [],
};

export function resetDb() {
  db.user = { ...seedUser };
  db.specialists = seedSpecialists();
}

resetDb();
