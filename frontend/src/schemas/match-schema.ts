export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ISpecialistCard {
  id: string;
  name: string;
  role: string;
  description: string;
  sessionFormats: string[];
  areasPractice: string[];
  credentials: string[];
  bookingUrl: string;
  profileUrl: string;
}

export interface IChatEntry extends IChatMessage {
  /** Cards shown under an assistant message. */
  specialists?: ISpecialistCard[];
}

export interface ITurnError {
  message: string;
  canRetry: boolean;
}

export interface IMatchRequest {
  forChildYouth: boolean;
  messages: IChatMessage[];
}

export interface IMatchResponse {
  reply: string;
  specialists: ISpecialistCard[];
}

export interface IAssociateResponse {
  specialists: ISpecialistCard[];
}

/** Matches the backend's limit on one request's thread. */
export const MAX_THREAD_MESSAGES = 20;
