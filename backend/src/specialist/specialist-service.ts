import { DatabaseError } from "pg";
import { embedDocuments } from "../shared/ai";
import { db, transaction } from "../shared/db";
import { InvalidFieldError, NotFoundError } from "../shared/errors";
import type { UpdateSpecialistInput } from "./specialist-validator";

export type Option = { id: string; name: string };

export type Specialist = {
  id: string;
  name: string;
  role: Option;
  description: string;
  bookingUrl: string;
  profileUrl: string;
  photoUrl: string | null;
  sessionFormats: Option[];
  areasPractice: Option[];
  credentials: Option[];
};

export type SpecialistSummary = { id: string; name: string; role: string; photoUrl: string | null };

const FOREIGN_KEY_VIOLATION = "23503";

const LINKS = [
  { table: "specialist_session_format", column: "session_format_id", lookup: "session_format", field: "sessionFormatIds" },
  { table: "specialist_areas_practice", column: "areas_practice_id", lookup: "areas_practice", field: "areasPracticeIds" },
  { table: "specialist_credentials", column: "credentials_id", lookup: "credentials", field: "credentialIds" },
] as const;

const linkedOptions = ({ table, column, lookup }: (typeof LINKS)[number]) => `COALESCE((
    SELECT json_agg(json_build_object('id', l.id, 'name', l.name) ORDER BY l.name)
    FROM ${table} j JOIN ${lookup} l ON l.id = j.${column}
    WHERE j.specialist_id = s.id), '[]')`;

const SELECT_SPECIALISTS = `
  SELECT s.id, s.name, s.description, s.booking_url AS "bookingUrl", s.profile_url AS "profileUrl",
    s.photo_url AS "photoUrl",
    json_build_object('id', r.id, 'name', r.name) AS role,
    ${linkedOptions(LINKS[0])} AS "sessionFormats",
    ${linkedOptions(LINKS[1])} AS "areasPractice",
    ${linkedOptions(LINKS[2])} AS "credentials"
  FROM specialist s JOIN role r ON r.id = s.role_id`;

/** Returns the specialists in the order of `ids`, skipping unknown ids. */
export const findSpecialistsByIds = async (ids: readonly string[]): Promise<Specialist[]> => {
  const { rows } = await db().query<Specialist>(`${SELECT_SPECIALISTS} WHERE s.id = ANY($1::uuid[])`, [ids]);
  return ids.flatMap((id) => rows.find((row) => row.id === id) ?? []);
};

export const getSpecialist = async (id: string): Promise<Specialist> => {
  const [specialist] = await findSpecialistsByIds([id]);
  if (!specialist) throw new NotFoundError("SPECIALIST_NOT_FOUND");
  return specialist;
};

export const listSpecialists = async (): Promise<SpecialistSummary[]> => {
  const { rows } = await db().query<SpecialistSummary>(
    `SELECT s.id, s.name, r.name AS role, s.photo_url AS "photoUrl" FROM specialist s JOIN role r ON r.id = s.role_id ORDER BY s.name`,
  );
  return rows;
};

const listLookup = async (table: string): Promise<Option[]> =>
  (await db().query<Option>(`SELECT id, name FROM ${table} ORDER BY name`)).rows;

export const listOptions = async () => {
  const [roles, sessionFormats, areasPractice, credentials] = await Promise.all([
    listLookup("role"),
    listLookup("session_format"),
    listLookup("areas_practice"),
    listLookup("credentials"),
  ]);
  return { roles, sessionFormats, areasPractice, credentials };
};

const toUnknownOptionError = (error: unknown): unknown => {
  if (!(error instanceof DatabaseError) || error.code !== FOREIGN_KEY_VIOLATION) return error;
  const field = LINKS.find((link) => link.table === error.table)?.field ?? "roleId";
  return new InvalidFieldError(`body.${field}`, "Unknown option");
};

export const updateSpecialist = async (id: string, input: UpdateSpecialistInput): Promise<Specialist> => {
  await transaction(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE specialist SET name = $2, role_id = $3, description = $4, booking_url = $5, profile_url = $6,
         photo_url = $7, embedding = NULL, updated_at = now()
       WHERE id = $1`,
      [id, input.name, input.roleId, input.description, input.bookingUrl, input.profileUrl, input.photoUrl],
    );
    if (rowCount === 0) throw new NotFoundError("SPECIALIST_NOT_FOUND");
    for (const link of LINKS) {
      await client.query(`DELETE FROM ${link.table} WHERE specialist_id = $1`, [id]);
      await client.query(`INSERT INTO ${link.table} (specialist_id, ${link.column}) SELECT $1, unnest($2::uuid[])`, [
        id,
        input[link.field],
      ]);
    }
  }).catch((error: unknown) => {
    throw toUnknownOptionError(error);
  });
  await embedSpecialists([id]).catch((error: unknown) => {
    console.error("Embedding failed, retrying on next start:", error instanceof Error ? error.message : error);
  });
  return getSpecialist(id);
};

const names = (options: readonly Option[]) => options.map((option) => option.name).join(", ");

const embeddingText = (specialist: Specialist) =>
  [
    `${specialist.name}, ${specialist.role.name}.`,
    specialist.description,
    `Areas of practice: ${names(specialist.areasPractice)}.`,
    `Session formats: ${names(specialist.sessionFormats)}.`,
    `Credentials: ${names(specialist.credentials)}.`,
  ].join("\n");

const embedSpecialists = async (ids: readonly string[]): Promise<void> => {
  const specialists = await findSpecialistsByIds(ids);
  if (specialists.length === 0) return;
  const embeddings = await embedDocuments(specialists.map(embeddingText));
  await Promise.all(
    specialists.map((specialist, index) =>
      db().query("UPDATE specialist SET embedding = $2::vector WHERE id = $1", [
        specialist.id,
        JSON.stringify(embeddings[index]),
      ]),
    ),
  );
};

/** Embeds specialists that have no embedding yet, e.g. after seeding or a failed re-embed. */
export const embedMissingSpecialists = async (): Promise<void> => {
  const { rows } = await db().query<{ id: string }>("SELECT id FROM specialist WHERE embedding IS NULL");
  await embedSpecialists(rows.map((row) => row.id));
};
