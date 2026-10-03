"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
export function ComponentSwitcher({
  current,
  families,
}: {
  current: string;
  families: { id: string; title: string }[];
}) {
  const router = useRouter();
  return (
    <Select.Root
      value={current}
      onValueChange={(value) => router.push(`/docs/components/${value}/`)}
    >
      <Select.Trigger aria-label="Choose component" className="component-switcher">
        <ChevronDown size={18} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={8} className="select-content">
          <Select.Viewport>
            {families.map((item) => (
              <Select.Item key={item.id} value={item.id} className="select-item">
                <Select.ItemText>{item.title}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
