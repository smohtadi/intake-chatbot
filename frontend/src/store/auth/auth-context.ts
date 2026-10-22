import type { IAuthUser } from "@/schemas/auth-schema";
import { createContext } from "react";

export interface AuthContextType {
  user: IAuthUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
