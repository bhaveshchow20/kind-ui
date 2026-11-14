export const primitivePages = [
  { id: "button", title: "Button" },
  { id: "textarea", title: "Textarea" },
  { id: "avatar", title: "Avatar" },
  { id: "tooltip", title: "Tooltip" },
  { id: "popover", title: "Popover" },
  { id: "menu", title: "Menu" },
  { id: "collapsible", title: "Collapsible" },
  { id: "badge", title: "Badge" },
  { id: "status", title: "Status" },
  { id: "code-block", title: "Code Block" },
  { id: "table", title: "Table" },
  { id: "dialog", title: "Dialog" },
  { id: "combobox", title: "Combobox" },
  { id: "hover-card", title: "Hover Card" },
] as const;
export type PrimitiveId = (typeof primitivePages)[number]["id"];
export function isPrimitiveId(id: string): id is PrimitiveId {
  return primitivePages.some((page) => page.id === id);
}
