import {
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  useInlineCitationCarousel,
} from "@kind-ui/ai/inline-citation";
import { Selection, SelectionContent } from "@kind-ui/ai/selection";
import { Uploader, UploaderTrigger } from "@kind-ui/ai/uploader";
import { PopoverPopup, PopoverPortal, PopoverPositioner } from "@kind-ui/primitives/popover";
import { useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import "./styles.css";

function CarouselControls() {
  const { index, api } = useInlineCitationCarousel();
  const [disabled, setDisabled] = useState(true);
  const [cancel, setCancel] = useState(false);
  const [calls, setCalls] = useState(0);
  const onClick: React.ComponentPropsWithRef<"button">["onClick"] = (event) => {
    setCalls((value) => value + 1);
    if (cancel) event.preventDefault();
  };
  return (
    <>
      <output data-testid="carousel-index" data-ready={!!api}>
        {index}
      </output>
      <output data-testid="carousel-calls">{calls}</output>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disabled controls
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={(event) => setCancel(event.target.checked)}
        />
        Cancel consumer action
      </label>
      <InlineCitationCarouselPrev
        render={<a href="#previous" />}
        disabled={disabled}
        onClick={onClick}
      >
        Previous
      </InlineCitationCarouselPrev>
      <InlineCitationCarouselNext render={<a href="#next" />} disabled={disabled} onClick={onClick}>
        Next
      </InlineCitationCarouselNext>
    </>
  );
}

function UploaderControls() {
  const [disabled, setDisabled] = useState(false);
  const [rootDisabled, setRootDisabled] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [calls, setCalls] = useState(0);
  return (
    <section aria-label="Uploader trigger">
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disable upload trigger
      </label>
      <label>
        <input
          type="checkbox"
          checked={rootDisabled}
          onChange={(event) => setRootDisabled(event.target.checked)}
        />
        Disable uploader
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={(event) => setCancel(event.target.checked)}
        />
        Cancel upload trigger
      </label>
      <output data-testid="upload-trigger-calls">{calls}</output>
      <Uploader disabled={rootDisabled}>
        <UploaderTrigger
          disabled={disabled}
          render={<a href="#upload-trigger" />}
          onClick={(event) => {
            setCalls((value) => value + 1);
            if (cancel) event.preventDefault();
          }}
        >
          Choose upload
        </UploaderTrigger>
      </Uploader>
    </section>
  );
}

function Fixture() {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [changes, setChanges] = useState<boolean[]>([]);
  return (
    <main>
      <UploaderControls />
      <InlineCitationCarousel className="w-80" opts={{ watchResize: false }}>
        <InlineCitationCarouselContent>
          <InlineCitationCarouselItem>First source</InlineCitationCarouselItem>
          <InlineCitationCarouselItem>Second source</InlineCitationCarouselItem>
        </InlineCitationCarouselContent>
        <CarouselControls />
      </InlineCitationCarousel>
      <output data-testid="selection-changes">{JSON.stringify(changes)}</output>
      <iframe
        ref={setFrame}
        title="Selection document"
        className="h-80 w-full"
        srcDoc={
          '<!doctype html><html lang="en"><head><title>Selection document</title></head><body></body></html>'
        }
        onLoad={() => setDocument(frame?.contentDocument ?? null)}
      />
      {document &&
        createPortal(
          <>
            <Selection onOpenChange={(open) => setChanges((values) => [...values, open])}>
              <SelectionContent>
                <p data-testid="selection-text">First passage. Second passage for selection.</p>
              </SelectionContent>
              <PopoverPortal container={document.body}>
                <PopoverPositioner anchor={document.body}>
                  <PopoverPopup
                    aria-label="Selection actions"
                    initialFocus={false}
                    finalFocus={false}
                  >
                    <button type="button">Explain selection</button>
                  </PopoverPopup>
                </PopoverPositioner>
              </PopoverPortal>
            </Selection>
            <button type="button" data-testid="outside-selection">
              Outside selection
            </button>
          </>,
          document.body,
        )}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Fixture />);
