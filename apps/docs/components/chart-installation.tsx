import { highlight } from "fumadocs-core/highlight";
import { Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import bundles from "@/generated/all-examples.json";
import { type InstallationStep, installationFor } from "@/lib/chart-installation.mjs";
import { componentBundleFor, componentBundlesSchema } from "@/lib/component-bundles.server.mjs";
import type { ComponentId } from "./component-playground";
import { InstallationTabs } from "./installation-tabs";
import { TrackedCodeBlock } from "./tracked-code-block";

const validatedBundles = componentBundlesSchema.parse(bundles);

async function installationCode(step: Pick<InstallationStep, "code" | "filename" | "language">) {
  return highlight(step.code, {
    lang: step.language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    components: {
      pre: ({ node: _node, ...props }) => (
        <TrackedCodeBlock title={step.filename}>
          <Pre {...props} />
        </TrackedCodeBlock>
      ),
    },
  });
}

export async function ChartInstallation({ id }: { id: ComponentId }) {
  const installation = installationFor(componentBundleFor(validatedBundles, id));
  const { command, steps } = installation;
  const blocks = await Promise.all(steps.map(installationCode));
  return (
    <InstallationTabs
      id={id}
      cli={
        <>
          <p>Run this command in your initialized shadcn project:</p>
          {await installationCode({ code: command, filename: "Terminal", language: "sh" })}
        </>
      }
      manual={
        <Steps>
          {steps.map((step, index) => (
            <Step key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {blocks[index]}
            </Step>
          ))}
        </Steps>
      }
    />
  );
}
