import assert from "node:assert/strict";
import test from "node:test";
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
} from "@kind-ui/primitives/combobox";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("Combobox parts retain native semantics and consumer render, state classes and styles", () => {
  const output = render(
    h(
      Combobox,
      { items: ["Atlas", "Archive"], inline: true, open: true, value: "Atlas" },
      h(ComboboxInput, {
        "aria-label": "Project",
        className: (state) => (state.open ? "consumer-input h-12" : ""),
        style: (state) => ({ color: state.open ? "red" : "blue" }),
        render: (props) => h("input", { ...props, "data-custom-input": "true" }),
      }),
      h(
        ComboboxList,
        { "aria-label": "Projects" },
        h(
          ComboboxItem,
          { value: "Atlas", className: "px-8 text-lg", style: { color: "green" } },
          "Atlas",
        ),
        h(ComboboxItem, { value: "Archive", disabled: true }, "Archive"),
      ),
      h(ComboboxStatus, null, "Host-owned loading status"),
    ),
  );
  assert.match(output, /role="combobox"/);
  assert.match(output, /aria-label="Project"/);
  assert.match(output, /data-custom-input="true"/);
  assert.match(output, /consumer-input h-12/);
  assert.match(output, /color:red/);
  assert.match(output, /role="listbox"/);
  assert.match(output, /aria-selected="true"/);
  assert.match(output, /aria-disabled="true"/);
  assert.match(output, /px-8 text-lg/);
  assert.match(output, /color:green/);
  assert.match(output, /Host-owned loading status/);
});

test("Combobox grouping and collection preserve object values and labels", () => {
  const items = [
    { id: "atlas", label: "Atlas" },
    { id: "fieldnotes", label: "Fieldnotes" },
  ];
  const groups = [{ label: "Projects", items }];
  const output = render(
    h(
      Combobox,
      { items: groups, inline: true, open: true, value: items[0] },
      h(ComboboxInput, { "aria-label": "Project" }),
      h(ComboboxList, null, (group) =>
        h(
          ComboboxGroup,
          { key: group.label, items: group.items },
          h(ComboboxGroupLabel, null, group.label),
          h(ComboboxCollection, null, (item) =>
            h(ComboboxItem, { key: item.id, value: item }, item.label),
          ),
        ),
      ),
    ),
  );
  assert.match(output, /Projects/);
  assert.match(output, /Atlas/);
  assert.match(output, /Fieldnotes/);
  assert.match(output, /role="group"/);
  assert.match(output, /aria-selected="true"/);
});

test("Combobox multiple selection and empty/loading messages remain host-owned", () => {
  const multiple = render(
    h(
      Combobox,
      { multiple: true, value: ["Atlas", "Fieldnotes"], inline: true, open: true },
      h(ComboboxInput, { "aria-label": "Projects" }),
      h(
        ComboboxList,
        null,
        h(ComboboxItem, { value: "Atlas" }, "Atlas"),
        h(ComboboxItem, { value: "Fieldnotes" }, "Fieldnotes"),
      ),
    ),
  );
  assert.match(multiple, /aria-multiselectable="true"/);
  assert.equal((multiple.match(/aria-selected="true"/g) ?? []).length, 2);
  const empty = render(
    h(
      Combobox,
      { items: [], inline: true, open: true },
      h(ComboboxInput, { "aria-label": "Projects" }),
      h(ComboboxEmpty, null, "No available projects"),
      h(ComboboxList),
      h(ComboboxStatus, null, "Fetching projects…"),
    ),
  );
  assert.match(empty, /No available projects/);
  assert.match(empty, /Fetching projects…/);
});

test("Combobox item cancellation suppresses internal click and pointer-release selection", () => {
  for (const handler of ["onClick", "onMouseUp"]) {
    const calls = [];
    const item = ComboboxItem({
      [handler]: (event) => {
        calls.push("consumer");
        event.defaultPrevented = true;
      },
    });
    item.props[handler]({
      defaultPrevented: false,
      preventBaseUIHandler: () => calls.push("cancel"),
    });
    assert.deepEqual(calls, ["consumer", "cancel"]);
    const uncancelled = ComboboxItem({ [handler]: () => calls.push("uncancelled") });
    uncancelled.props[handler]({
      defaultPrevented: false,
      preventBaseUIHandler: () => calls.push("unexpected"),
    });
    assert.deepEqual(calls, ["consumer", "cancel", "uncancelled"]);
  }
});

test("shared Combobox input exposes expanded semantics for persistent inline and popup lists", () => {
  for (const open of [undefined, true, false]) {
    const inline = render(
      h(
        Combobox,
        { inline: true, open, items: ["Atlas"] },
        h(ComboboxInput, { "aria-label": "Projects" }),
        h(ComboboxList),
      ),
    );
    assert.match(inline, /role="combobox"/);
    assert.match(inline, /aria-expanded="true"/);
  }
  for (const open of [false, true]) {
    const popup = render(
      h(Combobox, { open, items: ["Atlas"] }, h(ComboboxInput, { "aria-label": "Projects" })),
    );
    assert.match(popup, new RegExp(`aria-expanded="${open}"`));
  }
});

test("expanded semantics retain caller attributes, custom render props and native input state", () => {
  const overridden = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        "aria-label": "Projects",
        "aria-expanded": false,
      }),
    ),
  );
  assert.match(overridden, /aria-expanded="false"/);
  const roleOverride = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        "aria-label": "Projects",
        role: "searchbox",
      }),
    ),
  );
  assert.match(roleOverride, /role="searchbox"/);
  assert.doesNotMatch(roleOverride, /aria-expanded/);
  const elementRender = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        render: h("input", { "aria-label": "Projects", "aria-expanded": false }),
      }),
    ),
  );
  assert.match(elementRender, /aria-expanded="false"/);
  const custom = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        render: (props, state) =>
          h("input", { ...props, "aria-label": "Projects", "data-native-open": state.open }),
      }),
    ),
  );
  assert.match(custom, /aria-expanded="true"/);
  assert.match(custom, /data-native-open="false"/);
});

test("inline expanded fallback follows the final render element role and explicit attributes", () => {
  const roleOverride = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        render: h("input", { role: "searchbox", "aria-label": "Projects" }),
      }),
    ),
  );
  assert.match(roleOverride, /role="searchbox"/);
  assert.doesNotMatch(roleOverride, /aria-expanded/);
  const restoredRole = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        role: "searchbox",
        render: h("input", { role: "combobox", "aria-label": "Projects" }),
      }),
    ),
  );
  assert.match(restoredRole, /role="combobox"/);
  assert.match(restoredRole, /aria-expanded="true"/);
  const explicitExpanded = render(
    h(
      Combobox,
      { inline: true },
      h(ComboboxInput, {
        role: "searchbox",
        "aria-expanded": true,
        render: h("input", { role: "combobox", "aria-expanded": false, "aria-label": "Projects" }),
      }),
    ),
  );
  assert.match(explicitExpanded, /role="combobox"/);
  assert.match(explicitExpanded, /aria-expanded="false"/);
});
