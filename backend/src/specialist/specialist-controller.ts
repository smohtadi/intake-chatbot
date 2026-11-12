import type { Request, Response } from "express";
import {
  getSpecialist,
  listOptions,
  listSpecialists,
  updateSpecialist,
  type Specialist,
  type SpecialistSummary,
} from "./specialist-service";
import type { SpecialistParams, UpdateSpecialistInput } from "./specialist-validator";

export const listHandler = async (_req: Request, res: Response) => {
  res.status(200).json((await listSpecialists()).map(toSummaryDto));
};

export const optionsHandler = async (_req: Request, res: Response) => {
  res.status(200).json(await listOptions());
};

export const getHandler = async (req: Request<SpecialistParams>, res: Response) => {
  res.status(200).json(toDto(await getSpecialist(req.params.id)));
};

export const updateHandler = async (req: Request<SpecialistParams, unknown, UpdateSpecialistInput>, res: Response) => {
  res.status(200).json(toDto(await updateSpecialist(req.params.id, req.body)));
};

const toSummaryDto = ({ id, name, role, photoUrl }: SpecialistSummary) => ({ id, name, role, photoUrl });

const toDto = (specialist: Specialist) => ({
  id: specialist.id,
  name: specialist.name,
  role: specialist.role,
  description: specialist.description,
  bookingUrl: specialist.bookingUrl,
  profileUrl: specialist.profileUrl,
  photoUrl: specialist.photoUrl,
  sessionFormats: specialist.sessionFormats,
  areasPractice: specialist.areasPractice,
  credentials: specialist.credentials,
});
