"use client";

import { useState } from "react";
import { CanvasWorkflow } from "@/components/canvas/CanvasWorkflow";
import { InProjectTools } from "@/components/app/InProjectTools";
import { LinkedinExtension } from "@/components/app/extensions/LinkedinExtension";

/**
 * Client wrapper for a project's full workspace.
 *
 * The Extensions section is gated on the canvas reaching `step === "done"` —
 * cross-platform adapters can't run before there's a script + idea to adapt.
 * Quick tools (Get ideas / Write script / Make thumbnail / Judge) live in
 * the InProjectTools panel and are always available.
 */
export function ProjectWorkspace({ projectId, initialSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeExtension, setActiveExtension] = useState(null);

  const isDone = snapshot?.step === "done";

  return (
    <>
      <CanvasWorkflow
        projectId={projectId}
        initialSnapshot={initialSnapshot}
        onSnapshotChange={setSnapshot}
      />

      {isDone && activeExtension === "linkedin" && (
        <LinkedinExtension
          projectId={projectId}
          onClose={() => setActiveExtension(null)}
        />
      )}

      <InProjectTools
        projectId={projectId}
        canExtend={isDone}
        onOpenExtension={(key) => setActiveExtension(key)}
      />
    </>
  );
}
