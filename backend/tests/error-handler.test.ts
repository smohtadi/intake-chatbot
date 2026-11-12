import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { BadRequestError } from "../src/shared/errors";
import { errorHandler } from "../src/shared/middleware/error-handler";

const appThatThrows = (error: unknown) => {
  const app = express();
  app.get("/", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
};

describe("errorHandler", () => {
  it("serializes AppError subclasses", async () => {
    const res = await request(appThatThrows(new BadRequestError("NOPE"))).get("/").expect(400);
    expect(res.body).toEqual({ status: 400, title: "NOPE" });
  });

  it("returns 413 for oversized bodies", async () => {
    const tooLarge = Object.assign(new Error("request entity too large"), { status: 413 });
    const res = await request(appThatThrows(tooLarge)).get("/").expect(413);
    expect(res.body).toEqual({ status: 413, title: "PAYLOAD_TOO_LARGE" });
  });

  it("hides unexpected errors behind a 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(appThatThrows(new Error("db exploded"))).get("/").expect(500);
    expect(res.body).toEqual({ status: 500, title: "INTERNAL_SERVER_ERROR" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
