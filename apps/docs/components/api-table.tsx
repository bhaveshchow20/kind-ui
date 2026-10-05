import tables from "@/generated/api.json";
export function ApiTable({
  name,
  compact = false,
}: {
  name: keyof typeof tables;
  compact?: boolean;
}) {
  const table = tables[name];
  return (
    <div className="table-scroll">
      <table className="api-table">
        <caption>{name} props</caption>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Required</th>
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
                {!compact && entry.description && <p>{entry.description}</p>}
              </td>
              <td>{entry.required ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
