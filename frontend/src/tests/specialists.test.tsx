import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { db } from "@/tests/mocks/db";
import { renderWithProviders } from "@/tests/test-utils";
import TeamRoute from "@/app/routes/specialists/team-route";
import SpecialistEditRoute from "@/app/routes/specialists/specialist-edit-route";
import { paths } from "@/config/paths";

function renderSpecialistPages(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path={paths.team.path} element={<TeamRoute />} />
      <Route path={paths.specialistEdit.path} element={<SpecialistEditRoute />} />
    </Routes>,
    { route },
  );
}

describe("our team", () => {
  it("shows each specialist's name and role", async () => {
    renderSpecialistPages("/team");
    const link = await screen.findByRole("link", { name: /John Whitaker/ });
    expect(link).toHaveTextContent("Licensed Psychologist");
    expect(screen.getByRole("link", { name: /Priya Raman/ })).toHaveTextContent("Registered Clinical Counsellor");
  });

  it("shows the photo when there is one, otherwise initials", async () => {
    db.specialists[0].photoUrl = "https://example-clinic.ca/photos/john.jpg";
    renderSpecialistPages("/team");
    const john = await screen.findByRole("link", { name: /John Whitaker/ });
    expect(john.querySelector("img")).toHaveAttribute("src", "https://example-clinic.ca/photos/john.jpg");
    const priya = screen.getByRole("link", { name: /Priya Raman/ });
    expect(priya.querySelector("img")).toBeNull();
    expect(priya).toHaveTextContent(/^PR/);
  });

  it("opens the edit view on click", async () => {
    const { user } = renderSpecialistPages("/team");
    await user.click(await screen.findByRole("link", { name: /John Whitaker/ }));
    expect(await screen.findByRole("heading", { name: "Edit John Whitaker" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/team/spec-1/edit");
  });
});

describe("specialist edit", () => {
  it("fills every field from the specialist", async () => {
    renderSpecialistPages("/team/spec-1/edit");
    expect(await screen.findByLabelText("Name")).toHaveValue("John Whitaker");
    expect(screen.getByLabelText("Role")).toHaveValue("role-1");
    expect(screen.getByLabelText("Description")).toHaveValue("Works with adults facing anxiety and OCD.");
    const formats = screen.getByRole("group", { name: "Session format" });
    expect(within(formats).getByLabelText("In-Person")).toBeChecked();
    expect(within(formats).getByLabelText("Telehealth")).toBeChecked();
    expect(within(screen.getByRole("group", { name: "Credentials" })).getByLabelText("BCPA")).toBeChecked();
    expect(screen.getByLabelText("Booking URL")).toHaveValue("#");
    expect(screen.getByLabelText("Shareable profile URL")).toHaveValue("#");
    expect(screen.getByLabelText("Photo URL")).toHaveValue("");
  });

  it("saves the changes and returns to the list", async () => {
    const { user } = renderSpecialistPages("/team/spec-1/edit");
    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "John Whitaker-Ng");
    await user.selectOptions(screen.getByLabelText("Role"), "Registered Clinical Counsellor");
    await user.click(within(screen.getByRole("group", { name: "Session format" })).getByLabelText("In-Person"));
    await user.click(within(screen.getByRole("group", { name: "Areas of practice" })).getByLabelText("ADHD"));
    await user.type(screen.getByLabelText("Photo URL"), "https://example-clinic.ca/photos/john.jpg");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("link", { name: /John Whitaker-Ng/ })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/team$/);
    const saved = db.specialists.find((s) => s.id === "spec-1");
    expect(saved?.role.name).toBe("Registered Clinical Counsellor");
    expect(saved?.sessionFormats.map((f) => f.name)).toEqual(["Telehealth"]);
    expect(saved?.areasPractice.map((a) => a.name)).toEqual(["Anxiety and OCD", "ADHD"]);
    expect(saved?.photoUrl).toBe("https://example-clinic.ca/photos/john.jpg");
  });

  it("saves an empty photo URL as no photo", async () => {
    db.specialists[0].photoUrl = "https://example-clinic.ca/photos/john.jpg";
    const { user } = renderSpecialistPages("/team/spec-1/edit");
    await user.clear(await screen.findByLabelText("Photo URL"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("link", { name: /John Whitaker/ });
    expect(db.specialists[0].photoUrl).toBeNull();
  });

  it("blocks saving with invalid fields", async () => {
    const { user } = renderSpecialistPages("/team/spec-1/edit");
    await user.clear(await screen.findByLabelText("Name"));
    await user.click(within(screen.getByRole("group", { name: "Credentials" })).getByLabelText("BCPA"));
    const bookingUrl = screen.getByLabelText("Booking URL");
    await user.clear(bookingUrl);
    await user.type(bookingUrl, "not a url");
    await user.type(screen.getByLabelText("Photo URL"), "photo.jpg");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("This field is required")).toBeInTheDocument();
    expect(screen.getByText("Select at least one option")).toBeInTheDocument();
    expect(screen.getByText('This field must be a valid http(s) URL or "#"')).toBeInTheDocument();
    expect(screen.getByText("This field must be a valid http(s) URL")).toBeInTheDocument();
    expect(db.specialists.find((s) => s.id === "spec-1")?.name).toBe("John Whitaker");
  });

  it("goes back to the list on cancel", async () => {
    const { user } = renderSpecialistPages("/team/spec-1/edit");
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/team$/);
  });

  it("explains when the specialist does not exist", async () => {
    renderSpecialistPages("/team/unknown/edit");
    expect(await screen.findByText(/Could not load this specialist/)).toBeInTheDocument();
  });
});
