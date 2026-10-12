import assert from "node:assert/strict";

/**
 * @typedef {{id: string, files: Record<string, string>, defaultVariant?: string, variants?: Record<string, {source: string}>}} ConsumerBundle
 */
/** @template {ConsumerBundle} T @param {Record<string, T>} bundles */
export function expandConsumers(bundles) {
  return Object.values(bundles).flatMap((bundle) => [
    bundle,
    ...Object.entries(bundle.variants ?? {})
      .filter(([value]) => value !== bundle.defaultVariant)
      .map(([value, variant]) => ({
        ...bundle,
        id: `${bundle.id}:${value}`,
        files: { ...bundle.files, [`src/examples/${bundle.id}/example.tsx`]: variant.source },
      })),
  ]);
}

/** @template T @param {readonly T[]} consumers @param {string[]} [args] */
export function consumerShard(consumers, args = []) {
  if (args.length === 0) return { consumers, suffix: "" };
  assert.equal(args.length, 1, "Expected only --shard=index/total");
  const match = /^--shard=([1-9]\d*)\/([1-9]\d*)$/.exec(args[0] ?? "");
  assert.ok(match, "Expected --shard=index/total with positive integers");
  const index = Number(match[1]);
  const total = Number(match[2]);
  assert.ok(
    Number.isSafeInteger(index) && Number.isSafeInteger(total) && index <= total,
    "Shard index must be between 1 and total",
  );
  return {
    consumers: consumers.filter((_, position) => position % total === index - 1),
    suffix: `-shard-${index}-of-${total}`,
  };
}
