import { highlight } from "fumadocs-core/highlight";
import { Pre } from "fumadocs-ui/components/codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { PackageInstallCommand } from "@/lib/chart-installation.mjs";
import { TrackedCodeBlock } from "./tracked-code-block";

export async function PackageInstall({ commands }: { commands: readonly PackageInstallCommand[] }) {
  const blocks = await Promise.all(
    commands.map(({ command }) =>
      highlight(command, {
        lang: "sh",
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
        components: {
          pre: ({ node: _node, ...props }) => (
            <TrackedCodeBlock title="Terminal">
              <Pre {...props} />
            </TrackedCodeBlock>
          ),
        },
      }),
    ),
  );
  return (
    <Tabs
      items={commands.map(({ manager }) => manager)}
      groupId="kind-ui-package-manager"
      label="Package manager"
      data-package-install=""
      className="[&_[role=tab][data-state=inactive]]:text-fd-foreground"
    >
      {commands.map(({ manager }, index) => (
        <Tab key={manager} value={manager}>
          {blocks[index]}
        </Tab>
      ))}
    </Tabs>
  );
}
