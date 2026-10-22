import { describe, expect, it, vi } from "vitest";
import { useState, type SyntheticEvent } from "react";
import { screen } from "@testing-library/react";
import { Link } from "react-router-dom";
import { renderWithProviders } from "@/tests/test-utils";
import Button from "@/components/ui/button/button";
import { paths } from "@/config/paths";

describe("Button", () => {
  it("does not submit a form unless typed submit", async () => {
    const onSubmit = vi.fn((e: SyntheticEvent) => e.preventDefault());
    const { user } = renderWithProviders(
      <form onSubmit={onSubmit}>
        <Button>Cancel</Button>
        <Button type="submit">Save</Button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("keeps focus and ignores clicks while loading", async () => {
    const onSave = vi.fn();
    function SaveButton() {
      const [saving, setSaving] = useState(false);
      const save = () => {
        setSaving(true);
        onSave();
      };
      return (
        <Button isLoading={saving} onClick={save}>
          Save
        </Button>
      );
    }
    const { user } = renderWithProviders(<SaveButton />);
    const button = screen.getByRole("button", { name: "Save" });

    await user.click(button);
    await user.click(button);

    expect(onSave).toHaveBeenCalledOnce();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("does not follow a disabled link", async () => {
    const { user } = renderWithProviders(
      <Button asChild disabled>
        <Link to={paths.login.getHref()}>New post</Link>
      </Button>,
      { route: "/" },
    );
    const link = screen.getByRole("link", { name: "New post" });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    await user.click(link);
    expect(screen.getByTestId("location").textContent).toBe("/");
  });
});
