import { z } from "zod";

const MAX_VARCHAR = 255;
const MAX_DESCRIPTION = 5000;
const MAX_LINKED_ITEMS = 20;

const PLACEHOLDER_LINK = "#";

const httpUrl = z.url({ protocol: /^https?$/ }).max(MAX_VARCHAR);
const linkUrl = z.union([httpUrl, z.literal(PLACEHOLDER_LINK)]);

const idList = z
  .array(z.uuid())
  .min(1)
  .max(MAX_LINKED_ITEMS)
  .refine((ids) => new Set(ids).size === ids.length, "Must not contain duplicates");

export const specialistParamsSchema = z.object({ id: z.uuid() });

export const updateSpecialistSchema = z.object({
  name: z.string().trim().min(1).max(MAX_VARCHAR),
  roleId: z.uuid(),
  description: z.string().trim().min(1).max(MAX_DESCRIPTION),
  bookingUrl: linkUrl,
  profileUrl: linkUrl,
  photoUrl: httpUrl.nullable().default(null),
  sessionFormatIds: idList,
  areasPracticeIds: idList,
  credentialIds: idList,
});

export type SpecialistParams = z.infer<typeof specialistParamsSchema>;
export type UpdateSpecialistInput = z.infer<typeof updateSpecialistSchema>;
