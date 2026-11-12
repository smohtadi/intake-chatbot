import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAgent } from "../../../tests/login-agent";
import { createApp } from "../../app";
import { embedDocuments } from "../../shared/ai";

vi.mock("../../shared/ai", () => ({ chooseSpecialists: vi.fn(), embedDocuments: vi.fn(), embedQuery: vi.fn() }));

const JOHN_ID = "00000000-0000-4000-8000-000000000501";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000999";
const PROVISIONAL_PSYCHOLOGIST = "00000000-0000-4000-8000-000000000103";
const TELEHEALTH = "00000000-0000-4000-8000-000000000202";
const ADHD = "00000000-0000-4000-8000-000000000307";
const ASSESSMENT = "00000000-0000-4000-8000-000000000305";
const AFCC = "00000000-0000-4000-8000-000000000406";

const validUpdate = () => ({
  name: "John Whitaker-Ng",
  roleId: PROVISIONAL_PSYCHOLOGIST,
  description: "Now focused on ADHD assessments.",
  bookingUrl: "https://example-clinic.janeapp.com/#/staff_member/11",
  profileUrl: "https://example-clinic.ca/team/john-whitaker-ng",
  photoUrl: "https://example-clinic.ca/photos/john.jpg",
  sessionFormatIds: [TELEHEALTH],
  areasPracticeIds: [ADHD, ASSESSMENT],
  credentialIds: [AFCC],
});

beforeEach(() => {
  vi.mocked(embedDocuments).mockReset().mockImplementation(async (texts) => texts.map(() => Array(1024).fill(0.1)));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("auth on /api/specialists", () => {
  it("returns 401 without a cookie", async () => {
    await request(createApp()).get("/api/specialists").expect(401);
  });
});

describe("GET /api/specialists", () => {
  it("lists names and roles sorted by name", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get("/api/specialists").expect(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0]).toEqual({
      id: expect.any(String),
      name: "Amira Haddad",
      role: "Registered Clinical Counsellor",
      photoUrl: null,
    });
  });
});

describe("GET /api/specialists/options", () => {
  it("returns every lookup list", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get("/api/specialists/options").expect(200);
    expect(res.body.roles).toHaveLength(5);
    expect(res.body.sessionFormats.map((o: { name: string }) => o.name)).toEqual(["In-Person", "Telehealth"]);
    expect(res.body.areasPractice).toHaveLength(7);
    expect(res.body.credentials).toHaveLength(6);
  });
});

describe("GET /api/specialists/:id", () => {
  it("returns the specialist with its linked options", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get(`/api/specialists/${JOHN_ID}`).expect(200);
    expect(res.body).toMatchObject({
      id: JOHN_ID,
      name: "John Whitaker",
      role: { name: "Licensed Psychologist" },
      sessionFormats: [{ name: "In-Person" }, { name: "Telehealth" }],
      credentials: [{ name: "BCPA" }],
    });
    expect(res.body).not.toHaveProperty("embedding");
  });

  it("returns 404 for an unknown id", async () => {
    const agent = await loginAgent(createApp());
    await agent.get(`/api/specialists/${UNKNOWN_ID}`).expect(404);
  });

  it("returns 400 for a malformed id", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.get("/api/specialists/not-a-uuid").expect(400);
    expect(res.body.errors[0].path).toBe("params.id");
  });
});

describe("PUT /api/specialists/:id", () => {
  it("saves every field and re-embeds the specialist", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.put(`/api/specialists/${JOHN_ID}`).send(validUpdate()).expect(200);
    expect(res.body).toMatchObject({
      name: "John Whitaker-Ng",
      role: { id: PROVISIONAL_PSYCHOLOGIST, name: "Provisional Psychologist" },
      sessionFormats: [{ id: TELEHEALTH }],
      areasPractice: [{ name: "ADHD" }, { name: "Assessment" }],
      credentials: [{ name: "AFCC" }],
    });
    expect(embedDocuments).toHaveBeenCalledWith([expect.stringContaining("John Whitaker-Ng, Provisional Psychologist")]);
    const reloaded = await agent.get(`/api/specialists/${JOHN_ID}`).expect(200);
    expect(reloaded.body.description).toBe("Now focused on ADHD assessments.");
    expect(reloaded.body.photoUrl).toBe("https://example-clinic.ca/photos/john.jpg");
  });

  it("accepts # as a placeholder link", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent
      .put(`/api/specialists/${JOHN_ID}`)
      .send({ ...validUpdate(), bookingUrl: "#", profileUrl: "#" })
      .expect(200);
    expect(res.body).toMatchObject({ bookingUrl: "#", profileUrl: "#" });
  });

  it("clears the photo when photoUrl is null", async () => {
    const agent = await loginAgent(createApp());
    const res = await agent.put(`/api/specialists/${JOHN_ID}`).send({ ...validUpdate(), photoUrl: null }).expect(200);
    expect(res.body.photoUrl).toBeNull();
  });

  it("keeps the edit when embedding fails", async () => {
    vi.mocked(embedDocuments).mockRejectedValue(new Error("Voyage is down"));
    const agent = await loginAgent(createApp());
    const res = await agent.put(`/api/specialists/${JOHN_ID}`).send(validUpdate()).expect(200);
    expect(res.body.name).toBe("John Whitaker-Ng");
  });

  it.each([
    ["name", { name: "" }],
    ["roleId", { roleId: "teacher" }],
    ["bookingUrl", { bookingUrl: "javascript:alert(1)" }],
    ["profileUrl", { profileUrl: `https://example.com/${"a".repeat(255)}` }],
    ["photoUrl", { photoUrl: "ftp://example.com/photo.jpg" }],
    ["photoUrl", { photoUrl: "#" }],
    ["sessionFormatIds", { sessionFormatIds: [] }],
    ["areasPracticeIds", { areasPracticeIds: [ADHD, ADHD] }],
    ["credentialIds", { credentialIds: undefined }],
  ])("returns 400 for an invalid %s", async (field, override) => {
    const agent = await loginAgent(createApp());
    const res = await agent.put(`/api/specialists/${JOHN_ID}`).send({ ...validUpdate(), ...override }).expect(400);
    expect(res.body.errors[0].path).toBe(`body.${field}`);
  });

  it.each([
    ["roleId", { roleId: UNKNOWN_ID }],
    ["areasPracticeIds", { areasPracticeIds: [UNKNOWN_ID] }],
  ])("returns 400 for an unknown option in %s", async (field, override) => {
    const agent = await loginAgent(createApp());
    const res = await agent.put(`/api/specialists/${JOHN_ID}`).send({ ...validUpdate(), ...override }).expect(400);
    expect(res.body.errors).toEqual([{ path: `body.${field}`, message: "Unknown option" }]);
  });

  it("returns 404 for an unknown id", async () => {
    const agent = await loginAgent(createApp());
    await agent.put(`/api/specialists/${UNKNOWN_ID}`).send(validUpdate()).expect(404);
  });
});
