import { normalizeSeries } from "@kind-ui/charts-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, darkTheme, LineChart, lightTheme } from "../src/index.js";

const model = normalizeSeries(
  [
    { id: "a", label: "January", x: 1, y: 8 },
    { id: "b", label: "February", x: 2, y: null },
    { id: "c", label: "March", x: 3, y: 12 },
  ],
  { missing: "zero", x: { kind: "number", unit: null }, y: { unit: "USD" } },
);
afterEach(cleanup);

function LinkedViews() {
  const [selectedId, onSelectionChange] = useState<string | null>(null);
  return (
    <>
      <LineChart
        model={model}
        title="Revenue"
        selectedId={selectedId}
        onSelectionChange={onSelectionChange}
      />
      <DataTable
        model={model}
        caption="Exact revenue"
        selectedId={selectedId}
        onSelectionChange={onSelectionChange}
      />
    </>
  );
}

describe("React adapter", () => {
  it("links chart and table through one controlled selection", async () => {
    const user = userEvent.setup();
    render(<LinkedViews />);
    const point = screen.getByRole("button", { name: "January: 1, 8 USD" });
    const tableButton = screen.getByRole("button", { name: "Select January: 1, 8 USD" });
    await user.click(tableButton);
    expect(point.getAttribute("aria-pressed")).toBe("true");
    await user.click(point);
    expect(tableButton.getAttribute("aria-pressed")).toBe("false");
  });
  it("supports Enter, Space, and Escape without retaining local selection", () => {
    const onSelectionChange = vi.fn();
    const view = render(
      <LineChart
        model={model}
        title="Revenue"
        selectedId={null}
        onSelectionChange={onSelectionChange}
      />,
    );
    const point = screen.getByRole("button", { name: "January: 1, 8 USD" });
    fireEvent.keyDown(point, { key: "Enter" });
    expect(onSelectionChange).toHaveBeenLastCalledWith("a");
    expect(point.getAttribute("aria-pressed")).toBe("false");
    view.rerender(
      <LineChart
        model={model}
        title="Revenue"
        selectedId="a"
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.keyDown(point, { key: " " });
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(point, { key: "Escape" });
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
  });
  it("keeps path, values, and IDs unchanged when theme changes", () => {
    const view = render(<LineChart model={model} title="Revenue" theme={lightTheme} />);
    const path = view.container.querySelector("[data-chart-line]")?.getAttribute("d");
    const ids = [...view.container.querySelectorAll("[data-point-id]")].map((node) =>
      node.getAttribute("data-point-id"),
    );
    view.rerender(<LineChart model={model} title="Revenue" theme={darkTheme} />);
    expect(view.container.querySelector("[data-chart-line]")?.getAttribute("d")).toBe(path);
    expect(
      [...view.container.querySelectorAll("[data-point-id]")].map((node) =>
        node.getAttribute("data-point-id"),
      ),
    ).toEqual(ids);
    expect(model.yDomain).toEqual([0, 12]);
  });
  it("preserves source missingness in the exact-value table", () => {
    render(<DataTable model={model} caption="Exact revenue" />);
    expect(screen.getByText("Missing (shown as 0)")).toBeTruthy();
    expect(screen.getByText("8 USD")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("server-renders SVG and data table with unique accessible IDs", () => {
    const html = renderToString(
      <>
        <LineChart model={model} title="Revenue A" />
        <LineChart model={model} title="Revenue B" />
        <DataTable model={model} caption="Exact revenue" />
      </>,
    );
    const ids = [...html.matchAll(/<title id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(2);
    expect(html).toContain("<svg");
    expect(html).toContain("<table");
    expect(html).not.toContain("NaN");
  });
  it("renders an explicit empty state", () => {
    render(
      <LineChart
        model={normalizeSeries([], {
          missing: "gap",
          x: { kind: "number", unit: null },
          y: { unit: null },
        })}
        title="Empty data"
      />,
    );
    expect(screen.getByText("No observed values")).toBeTruthy();
  });
});
