import {
  Action,
  AgentRun,
  type AgentRunState,
  ChainOfThought,
  CheckpointTrigger,
  Confirmation,
  type ConfirmationResponse,
  Plan,
  type PlanTitleProps,
  Queue,
  Reasoning,
  type ReasoningProps,
  Task,
  TodoItem,
  Tool,
  ToolArgument,
  type ToolPart,
} from "@kind-ui/ai";
import { ActionTrigger } from "@kind-ui/ai/action";
import { AgentRunHeader } from "@kind-ui/ai/agent-run";
import { ChainOfThoughtHeader } from "@kind-ui/ai/chain-of-thought";
import { Checkpoint } from "@kind-ui/ai/checkpoint";
import { ConfirmationAccept } from "@kind-ui/ai/confirmation";
import { PlanTitle } from "@kind-ui/ai/plan";
import { QueueItem, type QueueMessage, Todo } from "@kind-ui/ai/queue";
import { ReasoningContent } from "@kind-ui/ai/reasoning";
import { TaskTrigger } from "@kind-ui/ai/task";
import { ToolOutput } from "@kind-ui/ai/tool";
import { createRef } from "react";

const rootRef = createRef<HTMLDivElement>();
const buttonRef = createRef<HTMLButtonElement>();
const response = async (decision: ConfirmationResponse) => {
  void decision.approved;
};
const onReasoningChange: ReasoningProps["onOpenChange"] = (_open, details) => {
  details?.cancel();
};
const state: AgentRunState = "running";
const part: ToolPart<{ query: string }, number> = {
  type: "dynamic-tool",
  toolName: "search",
  state: "output-available",
  input: { query: "Kind" },
  output: 0,
};
const message: QueueMessage = { id: "message", parts: [{ type: "text", text: "Pending" }] };
void part;
void message;
export const consumer = (
  <>
    <Tool state="input-available" ref={rootRef}>
      <ToolOutput output={false} />
      <ToolArgument value="{}" state="complete" />
    </Tool>
    <Confirmation
      state="approval-requested"
      approval={{ id: "a" }}
      onApprovalResponse={response}
      ref={rootRef}
    >
      <ConfirmationAccept ref={buttonRef} render={<button type="button" />} />
    </Confirmation>
    <Reasoning isStreaming onOpenChange={onReasoningChange}>
      <ReasoningContent markdownProps={{ streaming: true }}>Text</ReasoningContent>
    </Reasoning>
    <ChainOfThought>
      <ChainOfThoughtHeader>Steps</ChainOfThoughtHeader>
    </ChainOfThought>
    <Action>
      <ActionTrigger>Action</ActionTrigger>
    </Action>
    <AgentRun state={state}>
      <AgentRunHeader>Agent</AgentRunHeader>
    </AgentRun>
    <Plan isStreaming>
      <PlanTitle>Plan</PlanTitle>
    </Plan>
    <Task>
      <TaskTrigger title="Task" />
    </Task>
    <Queue>
      <ul>
        <QueueItem>Queued</QueueItem>
      </ul>
    </Queue>
    <Todo>
      <ul>
        <TodoItem status="progress">Working</TodoItem>
      </ul>
    </Todo>
    <Checkpoint>
      <CheckpointTrigger ref={buttonRef} tooltip="Restore" />
    </Checkpoint>
  </>
);

// @ts-expect-error Tool lifecycle does not accept an invented execution state.
export const invalidTool = <Tool state="executing" />;
// @ts-expect-error Dynamic tools require an explicit name.
export const unnamedTool: ToolPart = { type: "dynamic-tool", state: "input-available" };
// @ts-expect-error Todo state remains the original three-state display contract.
export const invalidTodo = <TodoItem status="error" />;
// @ts-expect-error Streaming plan titles preserve their existing string contract.
export const invalidTitle: PlanTitleProps = { children: 1 };
