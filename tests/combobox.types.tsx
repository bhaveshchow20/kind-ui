import {
  Combobox,
  ComboboxClear,
  ComboboxCollection,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  type ComboboxProps,
  ComboboxTrigger,
  ComboboxValue,
} from "@kind-ui/primitives/combobox";
import { createRef } from "react";

const inputRef = createRef<HTMLInputElement>();
const bodyRef = createRef<HTMLDivElement>();
const buttonRef = createRef<HTMLButtonElement>();
const projects = [{ id: "atlas", label: "Atlas" }];
type Project = (typeof projects)[number];

export const nativeComposition = (
  <Combobox<Project>
    items={projects}
    value={null}
    inputValue="Atlas"
    onValueChange={(project, details) => {
      project?.id.toUpperCase();
      // @ts-expect-error Root callbacks retain the selected object type.
      project?.unknownProperty;
      details.cancel();
    }}
    onInputValueChange={(query, details) => {
      query.toUpperCase();
      details.cancel();
    }}
  >
    <ComboboxInput
      ref={inputRef}
      aria-label="Project"
      style={(state) => ({ color: state.open ? "red" : "blue" })}
      className={(state) => (state.disabled ? "opacity-50" : "")}
      render={(props, state) => <input {...props} data-empty={state.listEmpty} />}
      onKeyDown={(event) => event.preventDefault()}
    />
    <ComboboxTrigger ref={buttonRef} aria-label="Show projects" />
    <ComboboxClear ref={buttonRef} aria-label="Clear project" />
    <ComboboxPortal>
      <ComboboxPositioner ref={bodyRef} side="bottom" sideOffset={6}>
        <ComboboxPopup ref={bodyRef}>
          <ComboboxList<Project> ref={bodyRef}>
            {(project) => (
              <ComboboxItem
                value={project}
                key={project.id}
                ref={bodyRef}
                disabled
                className={(state) => (state.selected ? "font-medium" : "")}
              >
                {project.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </ComboboxPortal>
  </Combobox>
);

export const multiple = (
  <Combobox
    items={projects}
    multiple
    value={projects}
    onValueChange={(values, details) => {
      values.map((value) => value.id);
      // @ts-expect-error Multiple selection stays an array of Project objects.
      values.map((value) => value.unknownProperty);
      details.cancel();
    }}
  >
    <ComboboxValue<Project[]>>
      {(values) => values.map((value) => value.label).join(", ")}
    </ComboboxValue>
    <ComboboxCollection<Project>>
      {(project) => (
        <ComboboxItem key={project.id} value={project}>
          {project.label}
        </ComboboxItem>
      )}
    </ComboboxCollection>
  </Combobox>
);
const multipleProps: ComboboxProps<Project, true> = { multiple: true, value: [] };
export const typedRoot = <Combobox {...multipleProps} />;

// @ts-expect-error Single selection receives an object, not an array.
export const invalidSingle = <Combobox<Project> value={projects} />;
// @ts-expect-error Multiple selection requires an array.
export const invalidMultiple = <Combobox<Project, true> multiple value={projects[0]} />;
// @ts-expect-error Native input refs cannot be replaced with body refs.
export const invalidInputRef = <ComboboxInput ref={bodyRef} />;

export const typedListItems = (
  <ComboboxList<Project>>
    {(project) => {
      // @ts-expect-error List render items are typed instead of accepting arbitrary properties.
      project.unknownProperty;
      return <ComboboxItem value={project}>{project.label}</ComboboxItem>;
    }}
  </ComboboxList>
);
export const typedCollectionItems = (
  <ComboboxCollection<Project>>
    {(project) => {
      // @ts-expect-error Collection render items retain the declared item type.
      project.unknownProperty;
      return <ComboboxItem value={project}>{project.label}</ComboboxItem>;
    }}
  </ComboboxCollection>
);
