import {
  HoverCard,
  HoverCardContent,
  type HoverCardContentProps,
  HoverCardPopup,
  HoverCardPortal,
  HoverCardPositioner,
  HoverCardTrigger,
} from "@kind-ui/primitives/hover-card";
import { createRef } from "react";

const anchor = createRef<HTMLAnchorElement>();
const div = createRef<HTMLDivElement>();
export const nativeHoverCard = (
  <HoverCard<{ title: string }>
    openDelay={200}
    closeDelay={300}
    open={false}
    onOpenChange={(_open, details) => details.cancel()}
  >
    {({ payload }) => (
      <>
        <HoverCardTrigger
          ref={anchor}
          href="#brief"
          payload={{ title: "Launch brief" }}
          delay={100}
          closeDelay={400}
          className={(state) => (state.open ? "underline" : "")}
          style={(state) => ({ opacity: state.open ? 1 : 0.8 })}
          onFocus={(event) => event.currentTarget.focus()}
          render={<a href="#brief">Read the brief</a>}
        />
        <HoverCardPortal ref={div} container={div} keepMounted>
          <HoverCardPositioner ref={div} side="top" align="start" sideOffset={12} sticky>
            <HoverCardPopup ref={div}>{payload?.title}</HoverCardPopup>
          </HoverCardPositioner>
        </HoverCardPortal>
      </>
    )}
  </HoverCard>
);
const content: HoverCardContentProps = {
  ref: div,
  container: div,
  collisionBoundary: "clipping-ancestors",
  collisionPadding: { top: 8, bottom: 12 },
  collisionAvoidance: { side: "flip", align: "shift" },
  positionMethod: "fixed",
  anchor,
  sticky: true,
  arrowPadding: 12,
  disableAnchorTracking: false,
  positionerProps: { ref: div, style: { zIndex: 80 } },
  portalProps: { ref: div, keepMounted: true },
  className: (state) => (state.open ? "p-6" : "p-2"),
  style: () => ({ maxWidth: 260 }),
};
export const composedHoverContent = <HoverCardContent {...content} />;
// @ts-expect-error Trigger delays use milliseconds as numbers.
export const invalidDelay = <HoverCard openDelay="slow" />;
// @ts-expect-error Native anchors do not acquire button-only attributes.
export const invalidTrigger = <HoverCardTrigger disabled />;
// @ts-expect-error Popup refs retain their native div contract.
export const invalidPopupRef = <HoverCardContent ref={anchor} />;
export const invalidPayload = (
  // @ts-expect-error Payload render children preserve their declared type.
  <HoverCard<{ title: string }>>{({ payload }) => payload?.missing}</HoverCard>
);
