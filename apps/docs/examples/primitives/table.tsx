"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableCopyMenu,
  TableDownloadMenu,
  TableFullscreen,
  TableFullscreenContent,
  TableFullscreenTrigger,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableViewport,
} from "@kind-ui/primitives";
import { useState } from "react";

const projects = [
  { name: "Website refresh", owner: "Jamie Chen", status: "In review" },
  { name: "Design system", owner: "Alex Morgan", status: "In progress" },
  { name: "Customer research", owner: "Sam Rivera", status: "Complete" },
];

function ProjectRows() {
  return (
    <Table>
      <TableCaption>Team projects · October 2026</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.name}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell className="whitespace-nowrap">{project.owner}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {project.status}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TableExample() {
  const [feedback, setFeedback] = useState("");

  return (
    <div className="w-full max-w-xl space-y-2">
      <TableContainer>
        <TableFullscreen>
          <TableToolbar>
            <span className="me-auto px-2 text-sm font-medium">Project overview</span>
            <TableCopyMenu
              onCopy={(format) => setFeedback(`Copied as ${format.toUpperCase()}.`)}
              onError={() => setFeedback("Clipboard unavailable. Select and copy the table.")}
            />
            <TableDownloadMenu
              filename="team-projects"
              onDownload={(format) => setFeedback(`Downloaded ${format.toUpperCase()}.`)}
              onError={() => setFeedback("Download unavailable. Try again.")}
            />
            <TableFullscreenTrigger />
          </TableToolbar>
          <TableViewport>
            <ProjectRows />
          </TableViewport>
          <TableFullscreenContent label="Team projects">
            <TableViewport className="min-h-0 flex-1 overflow-auto">
              <ProjectRows />
            </TableViewport>
          </TableFullscreenContent>
        </TableFullscreen>
      </TableContainer>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {feedback}
      </p>
    </div>
  );
}
