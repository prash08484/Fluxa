import { auth } from "@/auth";
import { listItems } from "@/services/library/store";
import { PageHeader } from "@/components/app/PageHeader";
import { LibraryList } from "@/components/app/LibraryList";

export const metadata = { title: "Library — vidagent" };

export default async function LibraryPage() {
  const me = await auth();
  const items = await listItems(me.user.id ?? me.user.email);

  return (
    <>
      <PageHeader
        hand="things you saved for later"
        title="Library"
        subtitle="Ideas you set aside during a project. Use them as the starting point for a new one."
      />
      <LibraryList initialItems={items} />
    </>
  );
}
