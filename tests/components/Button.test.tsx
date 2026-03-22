import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders a single interactive child when using asChild", () => {
    const { container } = render(
      <Button asChild>
        <a href="/destino">Ir a destino</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ir a destino" });
    expect(link).toBeTruthy();
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector("a a")).toBeNull();
    expect(container.querySelector("button a")).toBeNull();
  });
});
