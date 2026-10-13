import bundles from "@/generated/treemap-examples.json";
import { componentBundleFor, componentBundlesSchema } from "@/lib/component-bundles.server.mjs";

const validated = componentBundlesSchema.parse(bundles);
export function TreemapDataAlternative({ id }: { id: keyof typeof bundles }) {
  const data = componentBundleFor(validated, id).dataAlternative;
  if (!data) throw new Error(`Missing plotted data for ${id}`);
  const keys = Object.keys(data.columns);
  return (
    <section className="treemap-data-alternative sr-only" data-example={id}>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="py-2 text-left">{data.caption}</caption>
          <thead>
            <tr>
              {keys.map((key) => (
                <th scope="col" key={key} className="border-b p-2">
                  {data.columns[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {keys.map((key, column) =>
                  column === 0 ? (
                    <th scope="row" key={key} className="border-b p-2 font-normal">
                      {String(row[key] ?? "—")}
                    </th>
                  ) : (
                    <td key={key} className="border-b p-2">
                      {String(row[key] ?? "—")}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
