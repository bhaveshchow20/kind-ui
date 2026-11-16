import assert from "node:assert/strict";

/**
 * @param {{id: string, loadingVariant?: {prop: string, default: boolean}}} family
 * @param {{prop: string, default: string, options: {value: string}[]} | undefined} control
 */
export function loadingConsumerProp(family, control) {
  const loading = family.loadingVariant;
  if (loading) {
    assert.equal(loading.default, false, `${family.id} must start ready`);
    assert.match(loading.prop, /^[A-Za-z_$][\w$]*$/, `${family.id} loading prop`);
    return `${loading.prop}={pending}`;
  }
  assert.ok(control, `${family.id} native loading control`);
  assert.ok(
    control.options.some((option) => option.value === "loading"),
    `${family.id} native loading variant`,
  );
  assert.match(control.prop, /^[A-Za-z_$][\w$]*$/, `${family.id} variant prop`);
  return `${control.prop}={pending ? "loading" : ${JSON.stringify(control.default)}}`;
}

/** @param {string} source */
export function loadingConsumerLabel(source) {
  return source.match(/\bloadingLabel\s*=\s*["']([^"']+)["']/)?.[1] ?? "Loading chart";
}
