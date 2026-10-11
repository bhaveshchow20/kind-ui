import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";

const ajv = new Ajv({ strict: false });
ajv.addMetaSchema(
  ajv.getSchema("http://json-schema.org/draft-07/schema").schema,
  "https://json-schema.org/draft-07/schema",
);
const read = (name) => JSON.parse(readFileSync(new URL(`./schemas/${name}.json`, import.meta.url)));
ajv.addSchema(read("registry-item"), "https://ui.shadcn.com/schema/registry-item.json");
export const registryItemSchema = {
  parse(value) {
    const valid = ajv.getSchema("https://ui.shadcn.com/schema/registry-item.json");
    assert.ok(valid(value), JSON.stringify(valid.errors));
    return value;
  },
};
const validate = ajv.compile(read("registry"));
export const registrySchema = {
  parse(value) {
    assert.ok(validate(value), JSON.stringify(validate.errors));
    return value;
  },
};
