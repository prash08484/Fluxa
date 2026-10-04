import { PageHeader } from "@/components/app/PageHeader";
import { AnalyzeTool } from "@/components/app/tools/AnalyzeTool";

export const metadata = { title: "Judge & analyze — FluxAgent" };

export default function AnalyzePage() {
  return (
    <>
      <PageHeader
        hand="brutally honest scoring"
        title="Judge & analyze"
        subtitle="Paste a script or concept. Get scores across hook, structure, pacing, CTA and SEO — plus the top 3 fixes that move the needle."
      />
      <AnalyzeTool />
    </>
  );
}
