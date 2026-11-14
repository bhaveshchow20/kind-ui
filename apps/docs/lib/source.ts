import { loader } from "fumadocs-core/source";
import { docs, primitives } from "../.source/server";
import { docsBaseUrl } from "./routing.mjs";
export const source = loader({ baseUrl: docsBaseUrl, source: docs.toFumadocsSource() });
export const primitiveSource = loader({
  baseUrl: "/components",
  source: primitives.toFumadocsSource(),
});
