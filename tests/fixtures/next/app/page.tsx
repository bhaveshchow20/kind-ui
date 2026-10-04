import { LineChart } from "@kind-ui/charts";
import { InteractiveChart } from "./interactive-chart";

// The package entry establishes the client boundary for serializable server props.
export default function Page() {
  return (
    <main>
      <h1>Packed chart App Router consumer</h1>
      <LineChart
        aria-label="Server supplied chart"
        data={[
          { day: "Mon", tasks: 0 },
          { day: "Tue", tasks: 12 },
        ]}
        config={{ tasks: { label: "Tasks", color: "#3659b8" } }}
        xDataKey="day"
        animate={false}
      />
      <InteractiveChart />
      <table aria-label="Tasks data">
        <tbody>
          <tr>
            <th>Mon</th>
            <td>0</td>
          </tr>
          <tr>
            <th>Tue</th>
            <td>12</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
