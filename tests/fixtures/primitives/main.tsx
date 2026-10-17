import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  CodeBlock,
  Collapsible,
  CollapsibleContent,
  CollapsiblePreviewContent,
  CollapsibleTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Status,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableCopyMenu,
  TableFullscreen,
  TableFullscreenContent,
  TableFullscreenTrigger,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableViewport,
  Textarea,
  Tooltip,
} from "@kind-ui/primitives";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComboboxExample } from "./combobox-example";
import { DialogExample } from "./dialog-example";
import { HoverCardExample } from "./hover-card-example";
import "./styles.css";

function Fixture() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Region</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>North</TableCell>
          <TableCell>0</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 text-foreground">
      <h1>Primitive regression fixture</h1>
      <section aria-label="Controls" className="flex flex-wrap items-center gap-3">
        <Button loading loadingText="Saving">
          Save
        </Button>
        <Avatar>
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Badge tone="info">Review</Badge>
        <Status state="pending">Pending</Status>
        <Tooltip content="Helpful detail">
          <Button>Help</Button>
        </Tooltip>
        <Textarea aria-label="Working draft" defaultValue="Draft" />
      </section>
      <section aria-label="Overlays" className="flex flex-wrap gap-3">
        <Popover>
          <PopoverTrigger>Edit detail</PopoverTrigger>
          <PopoverContent>
            <PopoverTitle>Working detail</PopoverTitle>
            <Textarea aria-label="Detail" />
          </PopoverContent>
        </Popover>
        <Menu>
          <MenuTrigger>More actions</MenuTrigger>
          <MenuContent>
            <MenuItem>Copy detail</MenuItem>
            <MenuItem disabled>Unavailable</MenuItem>
          </MenuContent>
        </Menu>
        <DialogExample open={dialogOpen} onOpenChange={setDialogOpen} />
        <HoverCardExample openDelay={0} closeDelay={0} />
      </section>
      <section aria-label="Selection">
        <ComboboxExample value={destination} onValueChange={setDestination} />
      </section>
      <section aria-label="Disclosure">
        <Collapsible>
          <CollapsibleTrigger>Show details</CollapsibleTrigger>
          <CollapsibleContent>
            <p>Hidden details</p>
          </CollapsibleContent>
        </Collapsible>
        <Button ref={previewTrigger} onClick={() => setPreviewOpen(!previewOpen)}>
          Toggle preview
        </Button>
        <CollapsiblePreviewContent
          open={previewOpen}
          previewHeight={24}
          returnFocusRef={previewTrigger}
        >
          <div className="h-24">
            <a href="#root">Preview link</a>
          </div>
        </CollapsiblePreviewContent>
      </section>
      <section aria-label="Code example">
        <CodeBlock code={"const answer = 42;\nreturn answer;"} language="typescript" />
      </section>
      <section aria-label="Table">
        <TableContainer>
          <TableFullscreen>
            <TableToolbar>
              <TableCopyMenu />
              <TableFullscreenTrigger />
            </TableToolbar>
            <TableViewport>{table}</TableViewport>
            <TableFullscreenContent>{table}</TableFullscreenContent>
          </TableFullscreen>
        </TableContainer>
      </section>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Fixture />);
