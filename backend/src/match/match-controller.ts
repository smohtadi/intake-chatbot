import type { Request, Response } from "express";
import type { Specialist } from "../specialist/specialist-service";
import { findAssociates, matchSpecialists } from "./match-service";
import type { AssociateInput, MatchInput } from "./match-validator";

export const matchHandler = async (req: Request<unknown, unknown, MatchInput>, res: Response) => {
  const { reply, specialists } = await matchSpecialists(req.body);
  res.status(200).json({ reply, specialists: specialists.map(toCardDto) });
};

export const associateHandler = async (req: Request<unknown, unknown, AssociateInput>, res: Response) => {
  res.status(200).json({ specialists: (await findAssociates(req.body.name)).map(toCardDto) });
};

const toCardDto = (specialist: Specialist) => ({
  id: specialist.id,
  name: specialist.name,
  role: specialist.role.name,
  description: specialist.description,
  sessionFormats: specialist.sessionFormats.map((option) => option.name),
  areasPractice: specialist.areasPractice.map((option) => option.name),
  credentials: specialist.credentials.map((option) => option.name),
  bookingUrl: specialist.bookingUrl,
  profileUrl: specialist.profileUrl,
});
