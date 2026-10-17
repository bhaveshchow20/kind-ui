import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("Agent work subpaths expose the same runtime values as the public barrel", async () => {
  for (const name of [
    "tool",
    "confirmation",
    "reasoning",
    "chain-of-thought",
    "action",
    "agent-run",
    "plan",
    "task",
    "queue",
    "checkpoint",
  ]) {
    const module = await import(`@kind-ui/ai/${name}`);
    for (const [symbol, value] of Object.entries(module)) {
      // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Verify every public subpath export in this Node-only contract test.
      assert.equal(K[symbol], value, symbol);
    }
  }
});

test("tool values preserve falsy outputs, escape text and tolerate unserializable input", () => {
  for (const value of [0, false, null])
    assert.match(render(h(K.ToolOutput, { output: value })), new RegExp(String(value)));
  assert.equal(render(h(K.ToolOutput, { output: undefined })), "");
  assert.match(render(h(K.ToolOutput, { output: "" })), /data-slot="tool-block"/);
  assert.match(render(h(K.ToolOutput, { errorText: "Failed" })), /Failed/);
  assert.match(render(h(K.ToolOutput, { output: "<script>unsafe()</script>" })), /&lt;script&gt;/);
  const circular = {};
  circular.self = circular;
  assert.match(render(h(K.ToolInput, { input: circular })), /Value cannot be serialized/);
  assert.match(render(h(K.ToolInput, { input: { size: 3n } })), /3/);
});

test("tool streaming arguments accept partial JSON and preserve incomplete text", () => {
  const partial = render(h(K.ToolArgument, { value: '{"city":"Lon', state: "streaming" }));
  assert.match(partial, /aria-busy="true"/);
  assert.match(partial, /data-slot="tool-argument-key"/);
  assert.match(partial, /city/);
  assert.match(partial, /Lon/);
  const malformed = render(h(K.ToolArgument, { value: "{invalid", state: "complete" }));
  assert.match(malformed, /<pre[^>]*data-slot="tool-block"/);
  assert.match(malformed, /\{invalid/);
  assert.equal(render(h(K.ToolArgument, { value: "  " })), "");
});

test("tool input, approval receipt, running, denial and execution success stay distinct", () => {
  const ready = render(
    h(K.Tool, { state: "input-available" }, h(K.ToolStatus, { state: "input-available" })),
  );
  assert.match(ready, /Input ready/);
  assert.doesNotMatch(ready, /aria-busy|data-running|animate-spin|>Running</);
  const running = render(h(K.Tool, { state: "running" }, h(K.ToolStatus, { state: "running" })));
  assert.match(running, /aria-busy="true"/);
  assert.match(running, /data-running="true"/);
  assert.match(running, />Running</);
  const receipt = render(h(K.ToolStatus, { state: "approval-responded" }));
  assert.match(receipt, /Approval submitted/);
  assert.doesNotMatch(receipt, /Completed|Running|animate-spin/);
  assert.match(render(h(K.ToolStatus, { state: "output-denied" })), /Denied/);
  assert.match(render(h(K.ToolStatus, { state: "output-available" })), /Completed/);
});

test("approval lifecycle presents only pending decisions and hides resolved actions", () => {
  const controls = h(K.ConfirmationActions, null, h(K.ConfirmationReject), h(K.ConfirmationAccept));
  const pending = render(
    h(K.Confirmation, { state: "approval-requested", approval: { id: "a" } }, controls),
  );
  assert.match(pending, /aria-label="Confirmation"/);
  assert.match(pending, />Approve</);
  assert.match(pending, />Decline</);
  assert.doesNotMatch(pending, /Executed successfully/);
  const approved = render(
    h(
      K.Confirmation,
      { state: "approval-responded", approval: { id: "a", approved: true } },
      controls,
    ),
  );
  assert.match(approved, /data-state="approved"/);
  assert.doesNotMatch(approved, /data-slot="confirmation-action"/);
  assert.equal(render(h(K.Confirmation, { state: "input-streaming" }, controls)), "");
  const disabled = render(h(K.Confirmation, { submitting: true }, controls));
  assert.match(disabled, /aria-busy="true"/);
  assert.match(disabled, /Submitting decision/);
  assert.match(disabled, /disabled=""/);
});

test("section disclosures retain primitive composition and host-owned presentation", () => {
  for (const [Root, Trigger, Content, slot] of [
    [K.Action, K.ActionTrigger, K.ActionContent, "action"],
    [K.AgentRun, K.AgentRunHeader, K.AgentRunContent, "agent-run"],
    [K.ChainOfThought, K.ChainOfThoughtHeader, K.ChainOfThoughtContent, "chain-of-thought"],
    [K.Plan, K.PlanTrigger, K.PlanContent, "plan"],
    [K.Task, K.TaskTrigger, K.TaskContent, "task"],
    [K.QueueSection, K.QueueSectionTrigger, K.QueueSectionContent, "queue-section"],
    [K.Todo, K.TodoTrigger, K.TodoContent, "todo"],
    [K.Reasoning, K.ReasoningTrigger, K.ReasoningContent, "reasoning"],
  ]) {
    const output = render(
      h(
        Root,
        { open: true, id: slot },
        h(Trigger, { title: "Details" }, "Details"),
        h(Content, null, h("span", null, "Payload")),
      ),
    );
    assert.match(output, /aria-expanded="true"/);
    assert.match(output, /Payload/);
    assert.match(output, new RegExp(`data-slot="${slot}"`));
    assert.match(output, new RegExp(`id="${slot}"`));
  }
  assert.match(render(h(K.AgentRun, { state: "running" })), /aria-busy="true"/);
  assert.match(
    render(h(K.Plan, { isStreaming: true }, h(K.PlanTitle, null, "Working"))),
    /kind-shimmer/,
  );
});

test("Queue and Todo retain zero counts, status semantics and safe attachment URLs", () => {
  assert.match(render(h(K.QueueSectionLabel, { count: 0, label: "messages" })), />0</);
  assert.match(render(h(K.QueueItemIndicator, { completed: true })), /aria-label="Completed"/);
  assert.match(render(h(K.QueueItemIndicator)), /aria-label="Pending"/);
  const todo = render(
    h(
      K.TodoList,
      null,
      h(K.TodoItem, { status: "completed" }, h(K.TodoItemIcon), h(K.TodoItemLabel, null, "Done")),
    ),
  );
  assert.match(todo, /^<ul/);
  assert.match(todo, /<li/);
  assert.match(todo, /completed: /);
  assert.match(todo, /line-through/);
  assert.doesNotMatch(
    render(h(K.QueueItemImage, { src: "javascript:alert(1)", alt: "File" })),
    /src=/,
  );
  assert.match(render(h(K.QueueItemImage, { src: "/image.png", alt: "File" })), /loading="lazy"/);
});

test("native code and checkpoint contracts preserve consumer props and context errors", () => {
  assert.match(
    render(h(K.ToolBlock, { tabIndex: -1, id: "raw" }, "{}")),
    /^<pre[^>]*id="raw"[^>]*tabindex="-1"/,
  );
  const checkpoint = render(
    h(
      K.Checkpoint,
      null,
      h(K.CheckpointIcon),
      h(K.CheckpointTrigger, { "aria-label": "Restore", disabled: true }, "Restore"),
    ),
  );
  assert.match(checkpoint, /data-slot="checkpoint-trigger"/);
  assert.match(checkpoint, /aria-label="Restore"/);
  assert.match(checkpoint, /disabled=""/);
  assert.throws(() => render(h(K.ConfirmationAccept)), /within Confirmation/);
  assert.throws(() => render(h(K.ReasoningTrigger)), /require <Reasoning>/);
});

test("checkpoint variants reach the underlying button and retain their recipes", () => {
  for (const variant of ["default", "ghost", "outline"]) {
    const output = render(h(K.CheckpointTrigger, { variant }, "Restore"));
    assert.match(output, new RegExp(`data-variant="${variant}"`));
    if (variant === "default") {
      assert.match(output, /\bbg-primary\b/);
      assert.match(output, /\btext-primary-foreground\b/);
      assert.doesNotMatch(output, /\btext-muted-foreground\b|hover:bg-inset/);
    } else {
      assert.match(output, /\btext-muted-foreground\b/);
    }
  }
});
