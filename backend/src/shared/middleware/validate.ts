import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Validates and parses request input. Parsed values replace the originals,
 * so defaults and coercions (e.g. "2" -> 2) are visible to the controller.
 * Type the controller's Request generics with the matching z.infer types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validate = (schemas: Schemas): RequestHandler<any, any, any, any> => {
  return (req, _res, next) => {
    for (const location of ["params", "query", "body"] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (!result.success) throw new ValidationError(result.error, location);

      // req.query is a getter in Express 5, so redefine it instead of assigning.
      Object.defineProperty(req, location, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
};
