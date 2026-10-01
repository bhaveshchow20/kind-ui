export type Family = "area" | "line" | "bar";
export type Point = { period: string; primary: number | null; secondary: number | null };
export type Example = {
  id: string;
  title: string;
  detail: string;
  label: string;
  unit: string;
  data: Point[];
  second?: string;
  type?: "monotone" | "linear" | "stepAfter";
  stack?: "total" | "percent";
  horizontal?: boolean;
  dots?: boolean;
  labels?: boolean;
  target?: number;
};
const points = (values: (number | null)[], second?: (number | null)[]): Point[] =>
  values.map((primary, index) => ({
    period: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index] ?? String(index),
    primary,
    secondary: second?.[index] ?? null,
  }));
export const examples: Record<Family, Example[]> = {
  area: [
    {
      id: "smooth",
      title: "Smooth",
      detail: "Monotone interpolation",
      label: "Orders",
      unit: "orders",
      data: points([180, 260, 210, 340, 290, 420]),
      type: "monotone",
    },
    {
      id: "linear",
      title: "Linear",
      detail: "Straight segments",
      label: "Visitors",
      unit: "visitors",
      data: points([410, 280, 540, 330, 650, 520]),
      type: "linear",
    },
    {
      id: "step",
      title: "Step",
      detail: "Discrete changes",
      label: "Seats",
      unit: "seats",
      data: points([20, 20, 35, 35, 50, 65]),
      type: "stepAfter",
    },
    {
      id: "stacked",
      title: "Stacked",
      detail: "Shared stackId",
      label: "Desktop",
      second: "Mobile",
      unit: "visits",
      data: points([120, 210, 160, 230, 190, 270], [80, 110, 140, 120, 180, 160]),
      type: "monotone",
      stack: "total",
    },
    {
      id: "percent",
      title: "Percent",
      detail: "stackOffset=expand",
      label: "Direct",
      second: "Referral",
      unit: "visits",
      data: points([60, 90, 45, 110, 75, 140], [40, 30, 85, 50, 95, 60]),
      type: "linear",
      stack: "percent",
    },
    {
      id: "gaps",
      title: "Missing values",
      detail: "connectNulls=false",
      label: "Readings",
      unit: "°C",
      data: points([12, 17, null, 21, 18, 25]),
      type: "linear",
    },
  ],
  line: [
    {
      id: "linear",
      title: "Linear",
      detail: "Straight segments",
      label: "Requests",
      unit: "requests",
      data: points([240, 180, 310, 260, 390, 340]),
      type: "linear",
    },
    {
      id: "smooth",
      title: "Smooth",
      detail: "Monotone interpolation",
      label: "Response",
      unit: "ms",
      data: points([120, 180, 140, 230, 170, 280]),
      type: "monotone",
    },
    {
      id: "step",
      title: "Step",
      detail: "Discrete changes",
      label: "Capacity",
      unit: "seats",
      data: points([24, 24, 40, 40, 56, 72]),
      type: "stepAfter",
    },
    {
      id: "dots",
      title: "Dots & labels",
      detail: "Native dot and LabelList",
      label: "Completed",
      unit: "tasks",
      data: points([18, 27, 21, 34, 29, 42]),
      type: "linear",
      dots: true,
      labels: true,
    },
    {
      id: "comparison",
      title: "Comparison",
      detail: "Controlled series visibility",
      label: "Current",
      second: "Previous",
      unit: "orders",
      data: points([240, 290, 270, 340, 360, 420], [210, 250, 290, 280, 310, 350]),
      type: "linear",
      dots: true,
    },
    {
      id: "gaps",
      title: "Missing values",
      detail: "Gaps stay visible",
      label: "Sensor",
      unit: "°C",
      data: points([15, null, 19, 14, null, 23]),
      type: "linear",
      dots: true,
    },
    {
      id: "target",
      title: "Reference line",
      detail: "Native ReferenceLine",
      label: "Response",
      unit: "hours",
      data: points([14, 12, 10, 11, 8, 7]),
      type: "linear",
      target: 9,
    },
    {
      id: "signed",
      title: "Positive & negative",
      detail: "Numeric zero baseline",
      label: "Net change",
      unit: "users",
      data: points([24, -16, 38, -9, 18, -25]),
      type: "linear",
      target: 0,
    },
  ],
  bar: [
    {
      id: "vertical",
      title: "Vertical",
      detail: "Categorical X axis",
      label: "Borrowed",
      unit: "books",
      data: points([84, 112, 126, 105, 168, 210]),
    },
    {
      id: "horizontal",
      title: "Horizontal",
      detail: "layout=vertical",
      label: "Resolved",
      unit: "tickets",
      data: points([45, 72, 54, 98, 64, 116]),
      horizontal: true,
    },
    {
      id: "grouped",
      title: "Grouped",
      detail: "Native barGap",
      label: "Online",
      second: "In store",
      unit: "orders",
      data: points([80, 110, 120, 130, 140, 170], [160, 180, 150, 210, 220, 250]),
    },
    {
      id: "stacked",
      title: "Stacked",
      detail: "Shared stackId",
      label: "New",
      second: "Returning",
      unit: "visitors",
      data: points([120, 160, 140, 200, 170, 240], [80, 110, 100, 130, 150, 180]),
      stack: "total",
    },
    {
      id: "signed",
      title: "Positive & negative",
      detail: "Bars meet numeric zero",
      label: "Net change",
      unit: "users",
      data: points([24, -16, 38, -9, 18, -25]),
      target: 0,
    },
    {
      id: "labels",
      title: "Value labels",
      detail: "Native LabelList",
      label: "Completed",
      unit: "tasks",
      data: points([18, 27, 21, 34, 29, 42]),
      labels: true,
    },
  ],
};
