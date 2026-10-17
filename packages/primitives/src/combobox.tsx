"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { type HTMLProps, useRender } from "@base-ui/react/use-render";
import { type ComponentPropsWithRef, isValidElement, type ReactNode } from "react";
import { Button } from "./button.js";
import { cn } from "./utils.js";

export type ComboboxProps<
  Value,
  Multiple extends boolean | undefined = false,
> = BaseCombobox.Root.Props<Value, Multiple>;
/** Selection and search remain independently controlled by the host. */
export const Combobox = BaseCombobox.Root;

export type ComboboxPortalProps = ComponentPropsWithRef<typeof BaseCombobox.Portal>;
export const ComboboxPortal = BaseCombobox.Portal;

export type ComboboxInputProps = ComponentPropsWithRef<typeof BaseCombobox.Input>;
function ComboboxInputRenderer({
  inputProps,
  inputState,
  render,
}: {
  inputProps: HTMLProps<HTMLInputElement>;
  inputState: BaseCombobox.Input.State;
  render?: ComboboxInputProps["render"];
}) {
  const elementProps = isValidElement<HTMLProps<HTMLInputElement>>(render)
    ? render.props
    : undefined;
  const effectiveRole =
    elementProps && Object.hasOwn(elementProps, "role") ? elementProps.role : inputProps.role;
  return useRender({
    defaultTagName: "input",
    render: typeof render === "function" ? (props) => render(props, inputState) : render,
    props: {
      ...inputProps,
      // The inline list stays visible. Native popup inputs already supply their open state,
      // but the inline native input omits the attribute required by its combobox role.
      "aria-expanded":
        inputProps["aria-expanded"] ?? (effectiveRole === "combobox" ? true : undefined),
    },
  });
}

export function ComboboxInput({ className, render, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      data-slot="combobox-input"
      {...props}
      render={(inputProps, inputState) => (
        <ComboboxInputRenderer inputProps={inputProps} inputState={inputState} render={render} />
      )}
      className={(state) =>
        cn(
          "h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus-visible:shadow-kind-focus disabled:opacity-45 pointer-coarse:min-h-11",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxInputGroupProps = ComponentPropsWithRef<typeof BaseCombobox.InputGroup>;
export function ComboboxInputGroup({ className, ...props }: ComboboxInputGroupProps) {
  return (
    <BaseCombobox.InputGroup
      data-slot="combobox-input-group"
      {...props}
      className={(state) =>
        cn(
          "relative flex min-w-0 items-center gap-1",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxLabelProps = ComponentPropsWithRef<typeof BaseCombobox.Label>;
export function ComboboxLabel({ className, ...props }: ComboboxLabelProps) {
  return (
    <BaseCombobox.Label
      data-slot="combobox-label"
      {...props}
      className={(state) =>
        cn(
          "text-sm font-medium text-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxListProps<Value = unknown> = Omit<
  ComponentPropsWithRef<typeof BaseCombobox.List>,
  "children"
> & { children?: ReactNode | ((item: Value, index: number) => ReactNode) };
export function ComboboxList<Value = unknown>({ className, ...props }: ComboboxListProps<Value>) {
  return (
    <BaseCombobox.List
      data-slot="combobox-list"
      {...props}
      className={(state) =>
        cn(
          "max-h-80 scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none empty:p-0 [scrollbar-width:thin]",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxEmptyProps = ComponentPropsWithRef<typeof BaseCombobox.Empty>;
export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      data-slot="combobox-empty"
      {...props}
      className={(state) =>
        cn(
          "px-4 py-6 text-center text-sm text-muted-foreground empty:p-0",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxGroupProps = ComponentPropsWithRef<typeof BaseCombobox.Group>;
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return (
    <BaseCombobox.Group
      data-slot="combobox-group"
      {...props}
      className={(state) => cn(typeof className === "function" ? className(state) : className)}
    />
  );
}

export type ComboboxGroupLabelProps = ComponentPropsWithRef<typeof BaseCombobox.GroupLabel>;
export function ComboboxGroupLabel({ className, ...props }: ComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      data-slot="combobox-group-label"
      {...props}
      className={(state) =>
        cn(
          "px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxItemProps<Value = unknown> = Omit<
  ComponentPropsWithRef<typeof BaseCombobox.Item>,
  "value"
> & { value?: Value | undefined };
export function ComboboxItem<Value = unknown>({
  className,
  onClick,
  onMouseUp,
  ...props
}: ComboboxItemProps<Value>) {
  return (
    <BaseCombobox.Item
      data-slot="combobox-item"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) event.preventBaseUIHandler();
      }}
      onMouseUp={(event) => {
        onMouseUp?.(event);
        if (event.defaultPrevented) event.preventBaseUIHandler();
      }}
      className={(state) =>
        cn(
          "flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground outline-none data-highlighted:bg-secondary/60 data-selected:bg-secondary/60 data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-45 pointer-coarse:min-h-11",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxItemIndicatorProps = ComponentPropsWithRef<typeof BaseCombobox.ItemIndicator>;
export function ComboboxItemIndicator({ className, ...props }: ComboboxItemIndicatorProps) {
  return (
    <BaseCombobox.ItemIndicator
      data-slot="combobox-item-indicator"
      {...props}
      className={(state) =>
        cn(
          "ms-auto inline-flex size-5 shrink-0 items-center justify-center text-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxStatusProps = ComponentPropsWithRef<typeof BaseCombobox.Status>;
export function ComboboxStatus({ className, ...props }: ComboboxStatusProps) {
  return (
    <BaseCombobox.Status
      data-slot="combobox-status"
      {...props}
      className={(state) =>
        cn(
          "px-3 py-2 text-xs text-muted-foreground empty:p-0",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxSeparatorProps = ComponentPropsWithRef<typeof BaseCombobox.Separator>;
export function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps) {
  return (
    <BaseCombobox.Separator
      data-slot="combobox-separator"
      {...props}
      className={(state) =>
        cn(
          "mx-2 my-1.5 h-px bg-border/50",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxPositionerProps = ComponentPropsWithRef<typeof BaseCombobox.Positioner>;
export function ComboboxPositioner({ className, ...props }: ComboboxPositionerProps) {
  return (
    <BaseCombobox.Positioner
      data-slot="combobox-positioner"
      {...props}
      className={(state) =>
        cn("z-50", typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type ComboboxPopupProps = ComponentPropsWithRef<typeof BaseCombobox.Popup>;
export function ComboboxPopup({ className, ...props }: ComboboxPopupProps) {
  return (
    <BaseCombobox.Popup
      data-slot="combobox-popup"
      {...props}
      className={(state) =>
        cn(
          "max-h-(--available-height) min-w-(--anchor-width) overflow-hidden rounded-xl border border-border/60 bg-elevated text-foreground shadow-kind-float outline-none origin-(--transform-origin) transition-[opacity,transform,scale] duration-150 ease-out motion-safe:data-starting-style:scale-97 data-starting-style:opacity-0 motion-safe:data-ending-style:scale-97 data-ending-style:opacity-0 data-instant:transition-none motion-reduce:transform-none motion-reduce:scale-100 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ComboboxTriggerProps = ComponentPropsWithRef<typeof BaseCombobox.Trigger>;
export function ComboboxTrigger({ className, render, ...props }: ComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      data-slot="combobox-trigger"
      {...props}
      render={render ?? <Button variant="ghost" size="icon-sm" />}
      className={(state) =>
        cn("shrink-0", typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type ComboboxClearProps = ComponentPropsWithRef<typeof BaseCombobox.Clear>;
export function ComboboxClear({ className, render, ...props }: ComboboxClearProps) {
  return (
    <BaseCombobox.Clear
      data-slot="combobox-clear"
      {...props}
      render={render ?? <Button variant="ghost" size="icon-sm" />}
      className={(state) =>
        cn("shrink-0", typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type ComboboxCollectionProps<Value = unknown> = {
  children: (item: Value, index: number) => ReactNode;
};
export function ComboboxCollection<Value = unknown>(props: ComboboxCollectionProps<Value>) {
  return <BaseCombobox.Collection {...props} />;
}

export type ComboboxValueProps<Value = unknown> = Omit<
  ComponentPropsWithRef<typeof BaseCombobox.Value>,
  "children"
> & { children?: ReactNode | ((value: Value) => ReactNode) };
export function ComboboxValue<Value = unknown>(props: ComboboxValueProps<Value>) {
  return <BaseCombobox.Value {...props} />;
}
