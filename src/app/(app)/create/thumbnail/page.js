import { PageHeader } from "@/components/app/PageHeader";
import { ThumbnailTool } from "@/components/app/tools/ThumbnailTool";

export const metadata = { title: "Make thumbnail — FluxAgent" };

export default function ThumbnailPage() {
  return (
    <>
      <PageHeader
        hand="filmable with a phone"
        title="Make thumbnail"
        subtitle="Three concepts you can shoot with a phone + cheap props. Designer-ready briefs."
      />
      <ThumbnailTool />
    </>
  );
}
