"use client";

import { cva, type VariantProps } from "class-variance-authority";
// TabsContent adapted from Animate UI (MIT + Commons Clause): https://animate-ui.com/r/primitives-radix-tabs.json
import { motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

const TabMotionContext = React.createContext({ value: "", id: "" });

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const id = React.useId();
  return (
    <TabMotionContext.Provider value={{ value: String(props.value ?? ""), id }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
        {...props}
      />
    </TabMotionContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value, id } = React.useContext(TabMotionContext);
  const reduced = useReducedMotion();
  const { children, ...triggerProps } = props;
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className,
      )}
      {...triggerProps}
    >
      {value === props.value && (
        <motion.span
          aria-hidden="true"
          className="tab-selection"
          layoutId={reduced ? undefined : `tab-selection-${id}`}
          transition={{ type: "spring", stiffness: 430, damping: 36 }}
        />
      )}
      <span className="tab-label">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const reduced = useReducedMotion();
  return (
    <TabsPrimitive.Content
      asChild
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, filter: "blur(2px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: reduced ? 0 : 0.18 }}
      >
        {props.children}
      </motion.div>
    </TabsPrimitive.Content>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
