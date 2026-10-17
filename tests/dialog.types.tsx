import {
  Dialog,
  DialogBackdrop,
  type DialogBackdropProps,
  DialogClose,
  type DialogCloseProps,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogDescriptionProps,
  DialogPopup,
  type DialogPopupProps,
  DialogPortal,
  type DialogPortalProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
} from "@kind-ui/primitives/dialog";
import { createRef } from "react";

const button = createRef<HTMLButtonElement>();
const popup = createRef<HTMLDivElement>();
const title = createRef<HTMLHeadingElement>();
const description = createRef<HTMLParagraphElement>();
const nativeProps: DialogProps<{ id: string }> = {
  modal: "trap-focus",
  onOpenChange: (_open, details) => details.cancel(),
};
export const dialogParts = (
  <Dialog<{ id: string }> {...nativeProps}>
    <DialogTrigger<{ id: string }>
      ref={button}
      payload={{ id: "note" }}
      onClick={(event) => event.preventBaseUIHandler()}
      onAnimationStart={(event) => event.currentTarget.getAttribute(event.animationName)}
      render={<button type="button" />}
      className={(state) => (state.disabled ? "opacity-50" : "")}
    >
      Edit
    </DialogTrigger>
    <DialogPortal
      ref={popup}
      container={popup}
      themeSource={popup}
      keepMounted
      style={() => ({ colorScheme: "dark", "--consumer-color": "red" })}
    >
      <DialogBackdrop ref={popup} render={<div />} />
      <DialogPopup
        ref={popup}
        initialFocus={button}
        finalFocus={() => button.current}
        className={(state) => (state.open ? "consumer-open" : "")}
        onKeyDown={(event) => event.preventDefault()}
      >
        <DialogTitle ref={title} render={<h3>Working note</h3>}>
          Working note
        </DialogTitle>
        <DialogDescription ref={description}>Choose a next step.</DialogDescription>
        <DialogClose ref={button} render={<button type="button" />}>
          Done
        </DialogClose>
      </DialogPopup>
    </DialogPortal>
  </Dialog>
);
export const renderedPortal = (
  <Dialog>
    <DialogPortal
      ref={popup}
      themeSource={popup}
      style={() => ({ fontFamily: "serif", "--brand": "blue" })}
      className={() => "consumer-direct"}
      render={
        <div
          ref={popup}
          className="dark consumer-render"
          style={{ fontFamily: "monospace", "--brand": "red" } as React.CSSProperties}
        />
      }
    />
    <DialogPortal
      themeSource={popup}
      render={(props) => <div {...props} style={{ ...props.style, fontFamily: "monospace" }} />}
    />
  </Dialog>
);
export const dialogConvenience = (
  <Dialog defaultOpen>
    <DialogContent
      ref={popup}
      themeSource={popup}
      initialFocus={false}
      finalFocus={button}
      portalProps={{ ref: popup, keepMounted: true }}
      backdropProps={{ ref: popup, className: (state) => (state.open ? "bg-black/70" : "") }}
    >
      <DialogTitle>Note</DialogTitle>
    </DialogContent>
  </Dialog>
);
export type DialogPublicProps =
  | DialogTriggerProps<{ id: string }>
  | DialogPortalProps
  | DialogBackdropProps
  | DialogPopupProps
  | DialogContentProps
  | DialogTitleProps
  | DialogDescriptionProps
  | DialogCloseProps;
// @ts-expect-error Popup refs retain their native div contract.
export const invalidPopupRef = <DialogPopup ref={button} />;
// @ts-expect-error A custom source must be a DOM element or its ref.
export const invalidThemeSource = <DialogPortal themeSource=".theme" />;
// @ts-expect-error Trigger payload retains its declared shape.
export const invalidPayload = <DialogTrigger<{ id: string }> payload={{ id: 123 }} />;
