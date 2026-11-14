"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { ComponentProps } from "react";
import { cn } from "./utils.js";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export type AvatarProps = ComponentProps<typeof BaseAvatar.Root> & {
  size?: keyof typeof sizes | undefined;
};

export function avatarVariants({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes | undefined;
  className?: string | undefined;
} = {}) {
  return cn(
    "relative inline-flex shrink-0 overflow-hidden rounded-full bg-secondary font-sans font-medium text-secondary-foreground select-none",
    sizes[size],
    className,
  );
}

export function Avatar({ className, size = "md", ...props }: AvatarProps) {
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      data-size={size}
      className={(state) =>
        avatarVariants({
          size,
          className: typeof className === "function" ? className(state) : className,
        })
      }
      {...props}
    />
  );
}

export type AvatarImageProps = ComponentProps<typeof BaseAvatar.Image>;

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <BaseAvatar.Image
      data-slot="avatar-image"
      className={(state) =>
        cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-loading:invisible data-error:invisible motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export type AvatarFallbackProps = ComponentProps<typeof BaseAvatar.Fallback>;

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <BaseAvatar.Fallback
      data-slot="avatar-fallback"
      className={(state) =>
        cn(
          "absolute inset-0 flex size-full items-center justify-center rounded-[inherit] bg-secondary text-secondary-foreground [&_svg]:size-1/2",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}
