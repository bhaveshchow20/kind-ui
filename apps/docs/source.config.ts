import { defineConfig } from "fumadocs-mdx/config";
import {
  createFileSystemGeneratorCache,
  createGenerator,
  type GenerateOptions,
  remarkAutoTypeTable,
} from "fumadocs-typescript";

const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

const written = (type: string) => type.replace(/ \| undefined$/, "");

// Spells out string unions behind an alias (`PointStyle` reads `"default" | "border" | "colored-border"`),
// and shows short types as written rather than as "union"; `?` already says a prop is optional.
const transform: GenerateOptions["transform"] = function (entry, type) {
  const declared = written(entry.type);
  if (type.isUnionType()) {
    const members = type
      .getTypes()
      .map((member) => this.checker.typeToString(member))
      .filter((member) => member !== "undefined");
    if (members.every((member) => member.startsWith('"'))) entry.type = members.join(" | ");
  }
  const short = [written(entry.type), declared].find((each) => each.length <= 40);
  if (short) entry.simplifiedType = short;
};

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator, options: { transform } }]],
  },
});
