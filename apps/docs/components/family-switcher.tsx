"use client";
import { useRouter } from "next/navigation";
export function FamilySwitcher({
  current,
  families,
}: {
  current: string;
  families: { id: string; title: string }[];
}) {
  const router = useRouter();
  return (
    <label className="family-switcher">
      Chart family
      <select
        value={current}
        onChange={(event) => router.push(`/docs/components/${event.target.value}/`)}
      >
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.title}
          </option>
        ))}
      </select>
    </label>
  );
}
