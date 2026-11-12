import type { Metadata } from "next";
import { DEMO_WORKS, getWork } from "@/lib/data";
import { WorkView } from "./work-view";

export function generateStaticParams() {
  return DEMO_WORKS.map((w) => ({ id: w.id }));
}

export async function generateMetadata(props: PageProps<"/works/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const w = getWork(id) ?? getWork(id, DEMO_WORKS);
  const pretty = id.split("-").map((p) => p[0]?.toUpperCase() + p.slice(1)).join(" ");
  return { title: `${w?.title ?? pretty} · Canon`, description: w?.description };
}

export default async function WorkPage(props: PageProps<"/works/[id]">) {
  const { id } = await props.params;
  // Live works are loaded from the registry in the browser; demo works prerender.
  return <WorkView id={id} />;
}
