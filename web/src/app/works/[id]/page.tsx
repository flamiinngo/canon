import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORKS, getWork } from "@/lib/data";
import { WorkView } from "./work-view";

export function generateStaticParams() {
  return WORKS.map((w) => ({ id: w.id }));
}

export async function generateMetadata(props: PageProps<"/works/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const w = getWork(id);
  return { title: w ? `${w.title} · Canon` : "Not found · Canon", description: w?.description };
}

export default async function WorkPage(props: PageProps<"/works/[id]">) {
  const { id } = await props.params;
  const work = getWork(id);
  if (!work) notFound();
  return <WorkView id={work.id} />;
}
