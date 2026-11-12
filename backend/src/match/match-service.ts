import Fuse from "fuse.js";
import { config } from "../config";
import { chooseSpecialists, embedQuery, type ChatMessage } from "../shared/ai";
import { db } from "../shared/db";
import { BadGatewayError } from "../shared/errors";
import { findSpecialistsByIds, type Option, type Specialist } from "../specialist/specialist-service";
import { isCrisis, redactPii, sanitize } from "./match-safety";
import type { MatchInput } from "./match-validator";

const MAX_ASSOCIATE_MATCHES = 5;
const NAME_MATCH_THRESHOLD = 0.4;
const MAX_NAME_SCORE = 0.5;
const MAX_CANDIDATES = 6;
const CHILDREN_AND_YOUTH = "Children and Youth";

export type MatchResult = { reply: string; specialists: Specialist[] };

/** Fuzzy-matches a typed name against the roster, so "Jon" finds "John Whitaker". */
export const findAssociates = async (name: string): Promise<Specialist[]> => {
  const { rows } = await db().query<{ id: string; name: string }>("SELECT id, name FROM specialist");
  const fuse = new Fuse(rows, { keys: ["name"], threshold: NAME_MATCH_THRESHOLD, ignoreLocation: true, includeScore: true });
  const ids = fuse
    .search(sanitize(name), { limit: MAX_ASSOCIATE_MATCHES })
    .filter((result) => (result.score ?? 1) <= MAX_NAME_SCORE)
    .map((result) => result.item.id);
  return findSpecialistsByIds(ids);
};

const crisisReply = () =>
  "It sounds like you're going through something really hard. If you're thinking about suicide or may be in danger, " +
  "please call or text 9-8-8 (Suicide Crisis Helpline, any time) or call 911 now. " +
  `You can also reach our front desk at ${config.FRONT_DESK_PHONE}.`;

const noCandidatesReply = () =>
  `I couldn't find a specialist for that in our directory. Please call our front desk at ${config.FRONT_DESK_PHONE} and they'll help you.`;

const callAi = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    console.error("AI call failed:", error instanceof Error ? error.message : "unknown error");
    throw new BadGatewayError("LLM_ERROR");
  }
};

const findCandidates = async (queryText: string, forChildYouth: boolean): Promise<Specialist[]> => {
  const embedding = await callAi(() => embedQuery(queryText));
  const { rows } = await db().query<{ id: string }>(
    `SELECT s.id FROM specialist s
     WHERE s.embedding IS NOT NULL
       AND (NOT $2 OR EXISTS (
         SELECT 1 FROM specialist_areas_practice sap JOIN areas_practice a ON a.id = sap.areas_practice_id
         WHERE sap.specialist_id = s.id AND a.name = $3))
     ORDER BY s.embedding <=> $1::vector
     LIMIT $4`,
    [JSON.stringify(embedding), forChildYouth, CHILDREN_AND_YOUTH, MAX_CANDIDATES],
  );
  return findSpecialistsByIds(rows.map((row) => row.id));
};

const names = (options: readonly Option[]) => options.map((option) => option.name);

const toClinicData = (specialists: readonly Specialist[]) =>
  JSON.stringify(
    specialists.map((specialist) => ({
      id: specialist.id,
      name: specialist.name,
      role: specialist.role.name,
      description: specialist.description,
      sessionFormats: names(specialist.sessionFormats),
      areasPractice: names(specialist.areasPractice),
      credentials: names(specialist.credentials),
    })),
  );

/** Retrieves likely specialists and lets the LLM pick from them. Only ids it was given can come back. */
export const matchSpecialists = async ({ forChildYouth, messages }: MatchInput): Promise<MatchResult> => {
  const cleanMessages: ChatMessage[] = messages.map((message) => ({
    role: message.role,
    content: redactPii(sanitize(message.content)),
  }));
  const visitorText = cleanMessages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
  if (isCrisis(visitorText)) return { reply: crisisReply(), specialists: [] };

  const candidates = await findCandidates(visitorText, forChildYouth);
  if (candidates.length === 0) return { reply: noCandidatesReply(), specialists: [] };

  const answer = await callAi(() => chooseSpecialists(toClinicData(candidates), cleanMessages));
  const chosen = [...new Set(answer.specialistIds)].flatMap((id) => candidates.find((c) => c.id === id) ?? []);
  return { reply: answer.reply, specialists: chosen };
};
