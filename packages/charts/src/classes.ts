import { extendTailwindMerge } from "tailwind-merge";

// Only properties used by chart presentation or its dimension/spacing overrides.
// Aliases share Tailwind's existing directional shorthand conflicts; no CSS is parsed.
const propertyAliases: Readonly<Record<string, string>> = {
  "bg-color": "background-color",
  "bg-image": "background-image",
  "font-family": "font-family",
  "text-color": "color",
  w: "width",
  "min-w": "min-width",
  "max-w": "max-width",
  h: "height",
  "min-h": "min-height",
  "max-h": "max-height",
  p: "padding",
  px: "padding-inline",
  py: "padding-block",
  ps: "padding-inline-start",
  pe: "padding-inline-end",
  pbs: "padding-block-start",
  pbe: "padding-block-end",
  pt: "padding-top",
  pr: "padding-right",
  pb: "padding-bottom",
  pl: "padding-left",
  m: "margin",
  mx: "margin-inline",
  my: "margin-block",
  ms: "margin-inline-start",
  me: "margin-inline-end",
  mbs: "margin-block-start",
  mbe: "margin-block-end",
  mt: "margin-top",
  mr: "margin-right",
  mb: "margin-bottom",
  ml: "margin-left",
  "border-spacing": "border-spacing",
};

const mergeClasses = extendTailwindMerge((config) => {
  const conflicts: Record<string, readonly string[]> = {
    ...config.conflictingClassGroups,
    // Background tokens can contain a gradient, so preserve the shorthand until
    // a consumer supplies either a color or an image override.
    "arbitrary..background": ["bg-color", "bg-image"],
    "bg-color": [...(config.conflictingClassGroups["bg-color"] ?? []), "arbitrary..background"],
    "bg-image": [...(config.conflictingClassGroups["bg-image"] ?? []), "arbitrary..background"],
  };
  const withAliases = (groups: readonly string[]) =>
    groups.flatMap((group) =>
      propertyAliases[group] ? [group, `arbitrary..${propertyAliases[group]}`] : [group],
    );
  for (const [group, targets] of Object.entries(conflicts)) {
    conflicts[group] = withAliases(targets);
  }
  for (const [group, property] of Object.entries(propertyAliases)) {
    const alias = `arbitrary..${property}`;
    const targets = conflicts[group] ?? [];
    conflicts[alias] = [group, ...targets];
    conflicts[group] = [...targets, alias];
  }
  return { ...config, conflictingClassGroups: conflicts };
});

/** Consumer utilities win their Tailwind groups; custom classes remain intact. */
export function chartClasses(...values: (string | undefined | false)[]) {
  return mergeClasses(values.filter(Boolean).join(" "));
}
