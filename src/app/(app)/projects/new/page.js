import { PageHeader } from "@/components/app/PageHeader";
import { NewProjectWizard } from "@/components/app/NewProjectWizard";

export const metadata = { title: "New project — FluxAgent" };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        hand="one question at a time"
        title="New project"
        subtitle="Answer a few things. We'll build you the full canvas from there."
      />
      <NewProjectWizard />
    </>
  );
}
