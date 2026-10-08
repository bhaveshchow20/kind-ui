import mdx from "fumadocs-ui/mdx";
import tables from "@/generated/api.json";
import { referenceRows, referenceTitle } from "@/lib/api-reference.mjs";
export function ApiTable({
  name,
  compact: _compact = false,
}: {
  name: keyof typeof tables;
  compact?: boolean;
}) {
  const table = referenceRows(name, tables[name]);
  return (
    <section
      className="line-props-scroll"
      aria-label={`${referenceTitle(name)} props`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll wide API references.
      tabIndex={0}
    >
      <mdx.table>
        <caption style={{ textAlign: "left" }}>{referenceTitle(name)} props</caption>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {table.map((entry) => (
            <tr key={entry.name}>
              <th scope="row">
                <code>{entry.name}</code>
              </th>
              <td>
                <code>{entry.type}</code>
              </td>
              <td>{entry.default}</td>
              <td>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </mdx.table>
    </section>
  );
}
