import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonFlow } from "@/components/lesson/LessonFlow";
import { LessonView } from "@/components/lesson/LessonView";
import { getLessons, type PublishedLesson } from "@/lib/content/load";
import { toLessonView } from "@/lib/content/view";

// 빌드 때 만든 레슨 주소만 연다. 준비중 레슨 주소는 404
export const dynamicParams = false;

export async function generateStaticParams() {
  const lessons = await getLessons();
  return lessons.filter((l) => l.status === "공개").map((l) => ({ slug: l.slug }));
}

async function findLesson(slug: string) {
  const lessons = await getLessons();
  const lesson = lessons.find((l): l is PublishedLesson => l.slug === slug && l.status === "공개");
  return lesson ? { lesson, lessons } : null;
}

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const found = await findLesson((await params).slug);
  return found ? { title: found.lesson.title, description: found.lesson.meta.goal } : {};
}

export default async function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  const found = await findLesson((await params).slug);
  if (!found) notFound();
  const view = toLessonView(found.lesson, found.lessons);

  return (
    <Suspense fallback={<LessonView lesson={view} step="read" />}>
      <LessonFlow lesson={view} />
    </Suspense>
  );
}
