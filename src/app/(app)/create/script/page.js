import { PageHeader } from "@/components/app/PageHeader";
import { ScriptTool } from "@/components/app/tools/ScriptTool";

export const metadata = { title: "Write script — FluxAgent" };

export default function ScriptPage() {
  return (
    <>
      <PageHeader
        hand="hook + idea = script"
        title="Write script"
        subtitle="Bring your own idea and hook. We write the full script — opening, beats, payoff, CTA."
      />
      <ScriptTool />
    </>
  );
}
