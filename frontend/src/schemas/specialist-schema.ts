import { z } from "zod";
import { SCHEMA_ERRORS } from "@/schemas/schema-errors";

export interface IOption {
  id: string;
  name: string;
}

export interface ISpecialistSummary {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
}

export interface ISpecialist {
  id: string;
  name: string;
  role: IOption;
  description: string;
  bookingUrl: string;
  profileUrl: string;
  photoUrl: string | null;
  sessionFormats: IOption[];
  areasPractice: IOption[];
  credentials: IOption[];
}

export interface ISpecialistOptions {
  roles: IOption[];
  sessionFormats: IOption[];
  areasPractice: IOption[];
  credentials: IOption[];
}

const MAX_VARCHAR = 255;
const MAX_DESCRIPTION = 5000;

const httpUrl = z.url({ protocol: /^https?$/, error: SCHEMA_ERRORS.INVALID_URL }).max(MAX_VARCHAR, SCHEMA_ERRORS.TOO_LONG);
/** A link that goes nowhere, for demo data without real pages. */
export const PLACEHOLDER_LINK = "#";
const linkUrl = z
  .string()
  .trim()
  .refine((value) => value === PLACEHOLDER_LINK || httpUrl.safeParse(value).success, SCHEMA_ERRORS.INVALID_LINK);
const atLeastOne = z.array(z.string()).min(1, SCHEMA_ERRORS.SELECT_ONE);

export const specialistFormSchema = z.object({
  name: z.string().trim().min(1, SCHEMA_ERRORS.REQUIRED).max(MAX_VARCHAR, SCHEMA_ERRORS.TOO_LONG),
  roleId: z.string().min(1, SCHEMA_ERRORS.REQUIRED),
  description: z.string().trim().min(1, SCHEMA_ERRORS.REQUIRED).max(MAX_DESCRIPTION, SCHEMA_ERRORS.TOO_LONG),
  bookingUrl: linkUrl,
  profileUrl: linkUrl,
  photoUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || httpUrl.safeParse(value).success, SCHEMA_ERRORS.INVALID_URL),
  sessionFormatIds: atLeastOne,
  areasPracticeIds: atLeastOne,
  credentialIds: atLeastOne,
});

export type ISpecialistForm = z.infer<typeof specialistFormSchema>;

export type ISpecialistUpdate = Omit<ISpecialistForm, "photoUrl"> & { photoUrl: string | null };

export function toSpecialistForm(specialist: ISpecialist): ISpecialistForm {
  const ids = (options: IOption[]) => options.map((option) => option.id);
  return {
    name: specialist.name,
    roleId: specialist.role.id,
    description: specialist.description,
    bookingUrl: specialist.bookingUrl,
    profileUrl: specialist.profileUrl,
    photoUrl: specialist.photoUrl ?? "",
    sessionFormatIds: ids(specialist.sessionFormats),
    areasPracticeIds: ids(specialist.areasPractice),
    credentialIds: ids(specialist.credentials),
  };
}

export function toSpecialistUpdate(form: ISpecialistForm): ISpecialistUpdate {
  return { ...form, photoUrl: form.photoUrl || null };
}
