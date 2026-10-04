import { PageHeader } from "@/components/app/PageHeader";
import { IdeasTool } from "@/components/app/tools/IdeasTool";

export const metadata = { title: "Get ideas — FluxAgent" };

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        hand="just ideas, no fluff"
        title="Get ideas"
        subtitle="Drop your niche. We surface what's trending and turn it into 6–8 filmable video ideas."
      />
      <IdeasTool />
    </>
  );
}
