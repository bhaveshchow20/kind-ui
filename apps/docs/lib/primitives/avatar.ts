import type { ApiRow } from "@/components/api-table";

export const api = {
  Avatar: [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Avatar diameter and fallback text size.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Compose AvatarImage and AvatarFallback inside the root.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "<span>",
      description: "Replaces the root host through Base UI composition.",
    },
    {
      name: "className / style",
      type: 'AvatarProps["className"] / AvatarProps["style"]',
      default: "—",
      description: "Host styling; callbacks receive imageLoadingStatus.",
    },
    {
      name: "ref",
      type: "Ref<HTMLSpanElement>",
      default: "—",
      description: "Root host reference. Native span and accessibility attributes are forwarded.",
    },
  ],
  AvatarImage: [
    {
      name: "src / srcSet / sizes",
      type: "string",
      default: "—",
      description: "Native image source and responsive image selection.",
    },
    {
      name: "alt",
      type: "string",
      default: "—",
      description:
        "Image alternative text. Use an empty value if the root or adjacent content supplies its accessible name.",
    },
    {
      name: "onLoadingStatusChange",
      type: '(status: "idle" | "loading" | "loaded" | "error") => void',
      default: "—",
      description: "Observes image loading status changes.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "<img>",
      description: "Replaces the image host through Base UI composition.",
    },
    {
      name: "className / style",
      type: 'AvatarImageProps["className"] / AvatarImageProps["style"]',
      default: "—",
      description: "Host styling; callbacks receive imageLoadingStatus and transitionStatus.",
    },
    {
      name: "ref",
      type: "Ref<HTMLImageElement>",
      default: "—",
      description: "Image host reference. Other native image attributes are forwarded.",
    },
  ],
  AvatarFallback: [
    {
      name: "delay",
      type: "number",
      default: "— (immediate)",
      description:
        "Milliseconds to wait before displaying fallback content while the image is unavailable.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Initials or a fallback icon; hidden after the image loads.",
    },
    {
      name: "render",
      type: "ReactElement | render function",
      default: "<span>",
      description: "Replaces the fallback host through Base UI composition.",
    },
    {
      name: "className / style",
      type: 'AvatarFallbackProps["className"] / AvatarFallbackProps["style"]',
      default: "—",
      description: "Host styling; callbacks receive imageLoadingStatus.",
    },
    {
      name: "ref",
      type: "Ref<HTMLSpanElement>",
      default: "—",
      description:
        "Fallback host reference. Native span and accessibility attributes are forwarded.",
    },
  ],
  avatarVariants: [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Size in the optional options object. Returns an avatar recipe class string.",
    },
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Additional classes merged into the recipe.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
