"use client";
import type { ComponentPropsWithRef } from "react";
import { prepareSankeyData, type SankeyFlowData, type SankeyFlowLink } from "./sankey-data.js";

export type SankeyTableProps = Omit<ComponentPropsWithRef<"table">, "children"> & {
  data: SankeyFlowData;
  caption: string;
  formatValue?: (value: number) => string;
  onInspect?: (link: SankeyFlowLink) => void;
  activeLinkId?: string | null;
};
/** Native table and buttons provide an independent, complete keyboard flow inspector. */
export function SankeyTable({
  data,
  caption,
  formatValue = String,
  onInspect,
  activeLinkId,
  ...props
}: SankeyTableProps) {
  const validated = prepareSankeyData(data);
  return (
    <table {...props}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Flow</th>
          <th scope="col">Source</th>
          <th scope="col">Target</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {validated.links.map((link, index) => (
          <tr key={link.id} data-active={activeLinkId === link.id || undefined}>
            <th scope="row">
              {onInspect ? (
                <button
                  type="button"
                  aria-pressed={activeLinkId === link.id}
                  onClick={() => onInspect(data.links[index] as SankeyFlowLink)}
                >
                  {link.id}
                </button>
              ) : (
                link.id
              )}
            </th>
            <td>{validated.nodes[link.source]?.name}</td>
            <td>{validated.nodes[link.target]?.name}</td>
            <td>{formatValue(link.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
