import assert from "node:assert/strict";
import test from "node:test";
import { consumerShard, expandConsumers } from "./consumer-shards.mjs";

test("consumer sharding covers every complete example and non-default variant exactly once", () => {
  const bundles = Object.fromEntries(
    Array.from({ length: 17 }, (_, index) => [
      index,
      {
        id: `example-${index}`,
        files: {
          "package.json": "pinned",
          [`src/examples/example-${index}/example.tsx`]: "default",
        },
        defaultVariant: "glass",
        variants: {
          glass: { source: "default" },
          flat: { source: "flat" },
          glow: { source: "glow" },
        },
      },
    ]),
  );
  const consumers = expandConsumers(bundles);
  assert.equal(consumers.length, 51);
  assert.deepEqual(consumerShard(consumers).consumers, consumers);
  const shards = [1, 2, 3, 4].map((index) => consumerShard(consumers, [`--shard=${index}/4`]));
  const combined = shards.flatMap((shard) => shard.consumers);
  assert.equal(new Set(combined.map((consumer) => consumer.id)).size, 51);
  assert.deepEqual(
    combined.map((consumer) => consumer.id).sort(),
    consumers.map((consumer) => consumer.id).sort(),
  );
  for (const consumer of combined) {
    assert.equal(consumer.files["package.json"], "pinned");
    const [id, variant] = consumer.id.split(":");
    assert.equal(consumer.files[`src/examples/${id}/example.tsx`], variant ?? "default");
  }
  assert.equal(new Set(shards.map((shard) => shard.suffix)).size, 4);
});

test("consumer sharding rejects invalid or ambiguous shard arguments", () => {
  for (const args of [
    ["--shard=0/4"],
    ["--shard=5/4"],
    ["--shard=1/0"],
    ["--shard=1.5/4"],
    ["--shard=1/4", "--skip"],
    ["--skip"],
    ["--shard=9007199254740992/9007199254740992"],
  ])
    assert.throws(() => consumerShard([], args));
});
