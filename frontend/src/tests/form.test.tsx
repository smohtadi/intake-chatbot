import { describe, expect, it, vi } from "vitest";
import type { SyntheticEvent } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/test-utils";
import Form from "@/components/ui/form/form";

describe("Form.Field", () => {
  it("links the label, invalid state and error message to the control", () => {
    renderWithProviders(
      <Form>
        <Form.Field controlId="title" error="Required">
          <Form.Label>Title</Form.Label>
          <Form.Input />
        </Form.Field>
        <Form.Field controlId="sort" error="Pick one">
          <Form.Label>Sort</Form.Label>
          <Form.Select>
            <option value="">-</option>
          </Form.Select>
        </Form.Field>
        <Form.Field controlId="body">
          <Form.Label>Body</Form.Label>
          <Form.TextArea />
        </Form.Field>
      </Form>,
    );

    const title = screen.getByLabelText("Title");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Required");
    expect(screen.getByLabelText("Sort")).toHaveAccessibleDescription(
      "Pick one",
    );
    const body = screen.getByLabelText("Body");
    expect(body).not.toHaveAttribute("aria-invalid");
    expect(body).not.toHaveAttribute("aria-describedby");
  });

  it("marks the control required and reads the hint before the error", () => {
    renderWithProviders(
      <Form.Field
        controlId="slug"
        required
        hint="Lowercase letters and dashes"
        error="Required"
      >
        <Form.Label>Slug</Form.Label>
        <Form.Input />
      </Form.Field>,
    );

    // The required mark is CSS-only, so the label text stays "Slug".
    const slug = screen.getByLabelText("Slug");
    expect(slug).toHaveAttribute("aria-required", "true");
    expect(slug).toHaveAccessibleDescription(
      "Lowercase letters and dashes Required",
    );
  });

  it("keeps an id and description the caller passes", () => {
    renderWithProviders(
      <>
        <label htmlFor="standalone">Standalone</label>
        <Form.Input id="standalone" aria-describedby="hint" />
        <span id="hint">A hint</span>
      </>,
    );

    expect(screen.getByLabelText("Standalone")).toHaveAccessibleDescription(
      "A hint",
    );
  });
});

describe("Form.Checkbox", () => {
  it("toggles when its label is clicked", async () => {
    const { user } = renderWithProviders(<Form.Checkbox label="Published" />);

    await user.click(screen.getByText("Published"));

    expect(
      screen.getByRole("checkbox", { name: "Published" }),
    ).toBeChecked();
  });

  it("renders a bare, named checkbox for table rows", () => {
    renderWithProviders(
      <>
        <Form.Checkbox aria-label="Select all rows" indeterminate />
        {/* @ts-expect-error a checkbox without a label needs an aria name */}
        <Form.Checkbox />
      </>,
    );

    const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });
    expect((selectAll as HTMLInputElement).indeterminate).toBe(true);
  });
});

describe("Form", () => {
  const renderForm = (preventEnterSubmit?: boolean) => {
    const onSubmit = vi.fn((e: SyntheticEvent) => e.preventDefault());
    const result = renderWithProviders(
      <Form onSubmit={onSubmit} preventEnterSubmit={preventEnterSubmit}>
        <Form.Field controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Input />
        </Form.Field>
        <button type="submit">Save</button>
      </Form>,
    );
    return { onSubmit, ...result };
  };

  it("submits on Enter in a text input by default", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(screen.getByLabelText("Name"), "Ada{Enter}");

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("can stop Enter in a text input, but not on the submit button", async () => {
    const { user, onSubmit } = renderForm(true);

    await user.type(screen.getByLabelText("Name"), "Ada{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    screen.getByRole("button", { name: "Save" }).focus();
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
