import { Legend, Root } from "@kind-ui/charts";
import { MotionConfig, motion } from "motion/react";
import { useState } from "react";

// Create outside render; Motion owns the outer DOM, Recharts owns chart marks.
const MotionRoot = motion.create(Root);
const MotionLegend = motion.create(Legend);
const config = { value: { label: "Motion series", color: "#171717" } };
export function MotionContract() {
  const [visible, setVisible] = useState<string[]>(["value"]);
  return (
    <MotionConfig reducedMotion="user">
      <MotionRoot
        aria-label="Motion contract"
        role="region"
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        ref={(node) => {
          if (node) node.dataset.refTag = node.tagName;
        }}
        tabIndex={0}
        initial={false}
        animate={{ opacity: visible.length ? 1 : 0.6 }}
        transition={{ duration: 0.1 }}
        onFocus={(event) => {
          event.currentTarget.dataset.focused = "yes";
        }}
      >
        <MotionLegend
          ref={(node) => {
            if (node) node.dataset.refTag = node.tagName;
          }}
          initial={false}
          animate={{ opacity: 1 }}
          whileHover={{ opacity: 0.8 }}
          onClick={(event) => {
            event.currentTarget.dataset.clicked = "yes";
          }}
        />
      </MotionRoot>
    </MotionConfig>
  );
}
