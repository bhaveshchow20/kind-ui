import { expect, test } from "@playwright/test";

for (const lifecycle of [false, true]) {
  for (const decision of ["approved", "rejected"] as const) {
    for (const stage of ["state-change", "approval-response"]) {
      test(`${lifecycle ? "tool lifecycle" : "confirmation state"}: authoritative ${decision} ignores late ${stage} failure`, async ({
        page,
      }) => {
        await page.goto(`/?stage=${stage}${lifecycle ? "&lifecycle" : ""}`);
        const group = page.getByRole("group", { name: "Confirmation" });
        await group.getByRole("button", { name: "Approve", exact: true }).click();
        await expect(group).toHaveAttribute("aria-busy", "true");
        await expect(
          page.getByTestId(stage === "state-change" ? "state-calls" : "response-calls"),
        ).toHaveText("1");
        await page
          .getByRole("button", {
            name: decision === "approved" ? "Approve on host" : "Reject on host",
          })
          .click();
        await expect(group).toHaveAttribute("data-state", decision);
        await expect(group).toHaveAttribute("aria-busy", "false");
        await expect(group.getByRole("status")).toHaveText(
          decision === "approved" ? "Approved" : "Declined",
        );
        await page.getByRole("button", { name: "Fail submission" }).click();
        await expect(page.getByTestId("settled")).toHaveText("1");
        await expect(page.getByTestId("errors")).toHaveText("0");
        await expect(group.getByRole("alert")).toHaveCount(0);
        await expect(group.getByRole("button")).toHaveCount(0);
      });
    }
  }
}

test("authoritative resolution prevents stale success from forwarding an approval response", async ({
  page,
}) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "Confirmation" });
  await group.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("button", { name: "Reject on host" }).click();
  await page.getByRole("button", { name: "Complete submission" }).click();
  await expect(page.getByTestId("settled")).toHaveText("1");
  await expect(page.getByTestId("response-calls")).toHaveText("0");
  await expect(group).toHaveAttribute("data-state", "rejected");
});

test("a current failure stays retryable and a stale retry cannot report another error", async ({
  page,
}) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "Confirmation" });
  await group.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("button", { name: "Fail submission" }).click();
  await expect(group.getByRole("alert")).toContainText("Try again");
  await expect(page.getByTestId("errors")).toHaveText("1");
  await expect(group.getByRole("button", { name: "Approve", exact: true })).toBeEnabled();
  await group.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(group.getByRole("alert")).toHaveCount(0);
  await expect(page.getByTestId("state-calls")).toHaveText("2");
  await page.getByRole("button", { name: "Approve on host" }).click();
  await page.getByRole("button", { name: "Fail submission" }).click();
  await expect(page.getByTestId("settled")).toHaveText("2");
  await expect(page.getByTestId("errors")).toHaveText("1");
  await expect(group.getByRole("alert")).toHaveCount(0);
});

for (const decision of ["approved", "rejected"] as const) {
  test(`authoritative ${decision} clears an existing submission error`, async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Confirmation" });
    await group.getByRole("button", { name: "Approve", exact: true }).click();
    await page.getByRole("button", { name: "Fail submission" }).click();
    await expect(group.getByRole("alert")).toContainText("Try again");
    await page
      .getByRole("button", { name: decision === "approved" ? "Approve on host" : "Reject on host" })
      .click();
    await expect(group).toHaveAttribute("data-state", decision);
    await expect(group.getByRole("alert")).toHaveCount(0);
    await expect(page.getByTestId("errors")).toHaveText("1");
  });
}
