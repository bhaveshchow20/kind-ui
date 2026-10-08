"use client";

import {
  Children,
  type ComponentProps,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactNode,
} from "react";
import { Label, LabelList } from "recharts";
import { InteractionPaint } from "./animation.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";

type NativeLabel = ComponentProps<typeof LabelList>["content"];
type LabelOption =
  | ComponentProps<typeof LabelList>
  | ComponentProps<typeof Label>
  | NativeLabel
  | boolean
  | string
  | number
  | undefined;

// Content executes inside the native label's portal, so its paint/hits remain suppressible.
function VisibilityLabel({
  option,
  hidden,
  hiddenRows,
  seriesKey,
  categoryKeys,
  paintKey = "label",
  content: _nativeContent,
  ...props
}: ComponentProps<typeof Label> & {
  option: NativeLabel;
  hidden: boolean;
  hiddenRows?: readonly boolean[] | undefined;
  seriesKey?: string | undefined;
  categoryKeys?: readonly string[] | undefined;
  paintKey?: string;
}) {
  const suppressed = hidden || (props.index !== undefined && hiddenRows?.[props.index] === true);
  const category = props.index === undefined ? undefined : categoryKeys?.[props.index];
  const key = category ?? seriesKey;
  const interaction = useChartInteraction();
  const emphasis = useEmphasis(
    {
      kind: category === undefined ? "series" : "category",
      key: key ?? "",
      scope: category === undefined ? "series" : "radial",
      seriesKey: key,
    },
    key !== undefined &&
      !suppressed &&
      interaction.configured &&
      interaction.kind === (category === undefined ? "series" : "category") &&
      interaction.eligible.includes(key),
  );
  return (
    <g
      data-kind-ui="visibility-label"
      pointerEvents={suppressed ? "none" : undefined}
      aria-hidden={suppressed || undefined}
    >
      <InteractionPaint
        opacity={suppressed ? 0 : emphasis.factor}
        identity={JSON.stringify([paintKey, key, props.index])}
      >
        <Label {...props} {...(option !== undefined ? { content: option } : {})} zIndex={0} />
      </InteractionPaint>
    </g>
  );
}

/** Preserve native label options, geometry, index, formatter and outer portal ownership. */
export function visibilityLabel<T extends LabelOption>(
  label: T,
  hidden: boolean,
  hiddenRows?: readonly boolean[],
  seriesKey?: string,
  categoryKeys?: readonly string[],
): T {
  if (label === false || label === undefined) return label;
  const options: ComponentProps<typeof LabelList> | ComponentProps<typeof Label> =
    label === true
      ? {}
      : typeof label === "string" || typeof label === "number"
        ? { value: label }
        : isValidElement(label) || typeof label === "function"
          ? { content: label as Exclude<NativeLabel, undefined> }
          : (label as ComponentProps<typeof LabelList> | ComponentProps<typeof Label>);
  return {
    ...options,
    content: (
      <VisibilityLabel
        option={"content" in options ? options.content : undefined}
        hidden={hidden}
        hiddenRows={hiddenRows}
        seriesKey={seriesKey}
        categoryKeys={categoryKeys}
      />
    ),
  } as T;
}

/** Native LabelList children still consume the complete original native label entries. */
export function visibilityLabelChildren(
  children: ReactNode,
  hidden: boolean,
  hiddenRows?: readonly boolean[],
  seriesKey?: string,
  categoryKeys?: readonly string[],
): ReactNode {
  const hasLabels = (nodes: ReactNode): boolean =>
    Children.toArray(nodes).some(
      (child) =>
        isValidElement<{ children?: ReactNode }>(child) &&
        (child.type === LabelList || (child.type === Fragment && hasLabels(child.props.children))),
    );
  if (!hasLabels(children)) return children;
  return Children.map(children, (child, childIndex) => {
    if (!isValidElement<ComponentProps<typeof LabelList> & { children?: ReactNode }>(child))
      return child;
    if (child.type === Fragment)
      return cloneElement(
        child,
        {},
        visibilityLabelChildren(child.props.children, hidden, hiddenRows, seriesKey, categoryKeys),
      );
    if (child.type !== LabelList) return child;
    return cloneElement(child, {
      content: (
        <VisibilityLabel
          paintKey={`label-list:${child.key ?? childIndex}`}
          option={child.props.content}
          hidden={hidden}
          hiddenRows={hiddenRows}
          seriesKey={seriesKey}
          categoryKeys={categoryKeys}
        />
      ),
    });
  });
}
