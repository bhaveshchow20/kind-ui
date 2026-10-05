import { loader } from "fumadocs-core/source";
import { docs } from "../.source/server";
import { docsBaseUrl } from "./routing.mjs";
export const source = loader({ baseUrl: docsBaseUrl, source: docs.toFumadocsSource() });
