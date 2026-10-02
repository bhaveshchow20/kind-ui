"use client";
import { Switch as AnimatedSwitch, SwitchThumb } from "@/components/animate-ui/switch";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
export function Switch({className,...props}: React.ComponentProps<typeof AnimatedSwitch>) {
 const reduced=useReducedMotion();
 return <AnimatedSwitch {...props} className={cn("soft-switch",className)}>
  <SwitchThumb className="soft-switch-thumb" transition={reduced?{duration:0}:{type:"spring",stiffness:420,damping:32}} pressedAnimation={reduced?undefined:{width:22}}/>
 </AnimatedSwitch>;
}
