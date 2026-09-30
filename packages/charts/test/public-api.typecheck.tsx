import type { NormalizeOptions } from "@kind-ui/charts-core";
import type { SelectionProps } from "../src/index.js";

const controlled: SelectionProps = { selectedId: null, onSelectionChange: () => undefined };
const readOnly: SelectionProps = {};
// @ts-expect-error A callback cannot silently create uncontrolled state.
const callbackOnly: SelectionProps = { onSelectionChange: () => undefined };
// @ts-expect-error Selection without its change handler is not the interactive API.
const selectedOnly: SelectionProps = { selectedId: "a" };
// @ts-expect-error Time metadata cannot omit the display timezone.
const noTimezone: NormalizeOptions = { missing: "gap", x: { kind: "time" }, y: { unit: null } };
void [controlled, readOnly, callbackOnly, selectedOnly, noTimezone];
