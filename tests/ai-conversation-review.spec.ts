import { expect, test } from "@playwright/test";

test("controlled rich edits submit only the host value when rejected, delayed or accepted", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Controlled message" });
  await expect(editor).toHaveText("Host draft");
  await editor.fill("Rejected proposal");
  await expect(page.getByLabel("Proposed value")).toHaveText("Rejected proposal");
  await expect(editor).toHaveText("Host draft");
  await editor.press("Enter");
  await expect(page.getByLabel("Submitted value", { exact: true })).toHaveText("Host draft");
  await expect(page.getByLabel("Editor submitted value")).toHaveText("Host draft");

  await page.getByRole("combobox", { name: "Host mode" }).selectOption("delay");
  await editor.fill("Delayed proposal");
  await expect(editor).toHaveText("Host draft");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByLabel("Submitted value", { exact: true })).toHaveText("Host draft");
  await page.getByRole("button", { name: "Accept proposal" }).click();
  await expect(editor).toHaveText("Delayed proposal");

  await page.getByRole("combobox", { name: "Host mode" }).selectOption("accept");
  await editor.fill("Accepted proposal");
  await expect(editor).toHaveText("Accepted proposal");
  await editor.press("Enter");
  await expect(page.getByLabel("Submitted value", { exact: true })).toHaveText("Accepted proposal");
});

test("drag leave calls the consumer and respects cancellation", async ({ page }) => {
  await page.goto("/?case=drag");
  const form = page.getByRole("form", { name: "Drop target" });
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["draft"], "draft.txt"));
    return data;
  });
  await form.dispatchEvent("dragover", { dataTransfer: transfer });
  await expect(form).toHaveAttribute("data-dragging", "true");
  await form.dispatchEvent("dragleave");
  await expect(page.getByLabel("Drag leave calls")).toHaveText("1");
  await expect(form).not.toHaveAttribute("data-dragging");
  await page.getByRole("checkbox", { name: "Cancel drag leave" }).check();
  await form.dispatchEvent("dragover", { dataTransfer: transfer });
  await form.dispatchEvent("dragleave");
  await expect(page.getByLabel("Drag leave calls")).toHaveText("2");
  await expect(form).toHaveAttribute("data-dragging", "true");
  await transfer.dispose();
});

test("disabled prompts never request screen sharing and become actionable when enabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.dataset.captureRequests = "0";
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: async () => {
          document.documentElement.dataset.captureRequests = String(
            Number(document.documentElement.dataset.captureRequests ?? "0") + 1,
          );
          throw new DOMException("Canceled by regression fixture", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/?case=capture");
  const capture = page.getByRole("menuitem", { name: "Take screenshot" });
  await expect(capture).toHaveAttribute("aria-disabled", "true");
  await capture.dispatchEvent("click");
  await expect(page.locator("html")).toHaveAttribute("data-capture-requests", "0");
  await page.getByRole("button", { name: "Enable prompt" }).click();
  await capture.click();
  await expect(page.locator("html")).toHaveAttribute("data-capture-requests", "1");
  await expect(page.getByLabel("Canceled captures")).toHaveText("1");
});

test("composed React 19 refs clean each attached node and retain legacy and object refs", async ({
  page,
}) => {
  await page.goto("/?case=refs");
  await expect(page.getByRole("textbox", { name: "Ref editor" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle refs" }).click();
  await page.getByRole("button", { name: "Snapshot refs" }).click();
  const snapshot: {
    counters: Record<string, { attached: number; cleaned: number; nulls: number }>;
    legacyCount: { attached: number; nulls: number };
    objectAttached: boolean;
  } = JSON.parse(await page.getByLabel("Ref snapshot").innerText());
  for (const [name, count] of Object.entries(snapshot.counters)) {
    expect(count.attached, name).toBeGreaterThan(0);
    expect(count.cleaned, name).toBe(count.attached);
    if (name !== "editor") expect(count.nulls, name).toBe(0);
  }
  expect(snapshot.legacyCount.attached).toBeGreaterThan(0);
  expect(snapshot.legacyCount.nulls).toBe(snapshot.legacyCount.attached);
  expect(snapshot.objectAttached).toBe(false);
});
