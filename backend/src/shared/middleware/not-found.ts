import { NotFoundError } from "../errors";

export const notFound = () => {
  throw new NotFoundError("ROUTE_NOT_FOUND");
};
