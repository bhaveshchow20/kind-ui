const supportRows = ["Mon", "Tue", "Wed", "Thu"];
const supportColumns = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const supportValues = [
  [12, 34, 48, 39, 27, 8],
  [16, 42, 56, 45, 31, 0],
  [11, 29, null, 41, 24, 6],
  [18, 47, 60, 52, 33, null],
];
function observations(rows, columns, values) {
  return rows.flatMap((row, r) =>
    columns.map((column, c) => ({
      row,
      column,
      value: values[r][c] ?? "No report",
    })),
  );
}
const supportLabels = {
  caption: "Support requests by day and hour",
  columns: { row: "Day", column: "Hour", value: "Requests" },
  rows: observations(supportRows, supportColumns, supportValues),
};
export const family = {
  id: "heatmap",
  examples: [
    {
      id: "heatmap",
      title: "Heatmap",
      notes: "Support demand across four days and six two-hour intervals.",
      acceptance:
        "Twenty-four cells preserve zero, null and absent observations, with numeric tooltip inspection and native keyboard navigation.",
    },
    {
      id: "heatmap-compact",
      title: "Compact activity grid",
      notes: "Seven days and twenty-six weeks use fixed square cells and visually hidden headers.",
      acceptance:
        "182 cells retain their value names and header associations; narrow hosts scroll without enlarging the page.",
    },
    {
      id: "heatmap-diverging",
      title: "Signed comparisons",
      notes: "Regional orders compared with their monthly target on a symmetric scale.",
      acceptance:
        "Sixteen cells share a -20 to +20 percent domain; zero matches the neutral midpoint and missing data stays distinct.",
    },
    {
      id: "heatmap-materials",
      title: "Cell materials",
      notes: "Default, Clay and Glow edge treatments preserve quantitative cell centers.",
      acceptance:
        "The selected material agrees with full source and preview; missing cells remain patterned without a material.",
    },
  ],
  dataLabels: {
    "heatmap-compact": {
      caption: "Contributions by day and week",
      columns: { row: "Day", column: "Week", value: "Contributions" },
      rows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].flatMap((row, r) =>
        Array.from({ length: 26 }, (_, c) => ({
          row,
          column: `Week ${c + 1}`,
          value: (r + c) % 5,
        })),
      ),
    },
    heatmap: supportLabels,
    "heatmap-materials": supportLabels,
    "heatmap-diverging": {
      caption: "Regional orders versus monthly target",
      columns: { row: "Region", column: "Month", value: "Difference (%)" },
      rows: observations(
        ["North", "South", "East", "West"],
        ["Apr", "May", "Jun", "Jul"],
        [
          [-12, -6, 0, 14],
          [4, 11, 18, 7],
          [-20, -9, -3, null],
          [2, 0, 9, 20],
        ],
      ),
    },
  },
  variants: {
    "heatmap-materials": {
      control: "Material",
      prop: "material",
      default: "plain",
      options: [
        { value: "plain", label: "Default" },
        { value: "clay", label: "Clay" },
        { value: "glow", label: "Glow" },
      ],
    },
  },
};
