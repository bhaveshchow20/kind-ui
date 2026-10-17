import {
  Confirmation,
  ConfirmationAccept,
  ConfirmationActions,
  ConfirmationReject,
  type ConfirmationState,
} from "@kind-ui/ai/confirmation";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

function deferred() {
  let resolve = () => {};
  let reject = (_error: Error) => {};
  const promise = new Promise<void>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

function Fixture() {
  const params = new URL(window.location.href).searchParams;
  const lifecycle = params.has("lifecycle");
  const stage = params.get("stage") ?? "state-change";
  const [state, setState] = useState<ConfirmationState>("pending");
  const [errors, setErrors] = useState(0);
  const [stateCalls, setStateCalls] = useState(0);
  const [responseCalls, setResponseCalls] = useState(0);
  const [settled, setSettled] = useState(0);
  const submission = useRef<ReturnType<typeof deferred> | null>(null);
  const wait = () => {
    const request = deferred();
    submission.current = request;
    return request.promise;
  };
  const settle = async (fail: boolean) => {
    const current = submission.current;
    if (!current) return;
    submission.current = null;
    if (fail) current.reject(new Error("Submission failed"));
    else current.resolve();
    await current.promise.catch(() => {});
    setSettled((count) => count + 1);
  };
  return (
    <main>
      <Confirmation
        state={
          lifecycle
            ? state === "pending"
              ? "approval-requested"
              : state === "approved"
                ? "approval-responded"
                : "output-denied"
            : state
        }
        approval={{
          id: "same-approval",
          ...(state === "pending" ? {} : { approved: state === "approved" }),
        }}
        onStateChange={() => {
          setStateCalls((count) => count + 1);
          if (stage === "state-change") return wait();
        }}
        onApprovalResponse={() => {
          setResponseCalls((count) => count + 1);
          if (stage === "approval-response") return wait();
        }}
        onDecisionError={() => setErrors((count) => count + 1)}
      >
        <ConfirmationActions>
          <ConfirmationAccept />
          <ConfirmationReject />
        </ConfirmationActions>
      </Confirmation>
      <button type="button" onClick={() => setState("approved")}>
        Approve on host
      </button>
      <button type="button" onClick={() => setState("rejected")}>
        Reject on host
      </button>
      <button type="button" onClick={() => setState("pending")}>
        Request again
      </button>
      <button type="button" onClick={() => void settle(true)}>
        Fail submission
      </button>
      <button type="button" onClick={() => void settle(false)}>
        Complete submission
      </button>
      <output data-testid="errors">{errors}</output>
      <output data-testid="state-calls">{stateCalls}</output>
      <output data-testid="response-calls">{responseCalls}</output>
      <output data-testid="settled">{settled}</output>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Fixture />);
