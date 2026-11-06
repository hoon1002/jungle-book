import Link from "next/link";
import { getLessons } from "@/lib/content/load";

// 임시 홈: 4단계에서 강좌 지도로 바뀐다. 지금은 레슨으로 들어가는 길만 둔다.
export default async function Home() {
  const lessons = await getLessons();
  return (
    <main className="mx-auto max-w-column px-5 py-16">
      <h1 className="font-display text-title font-bold tracking-tight sm:text-title-lg">정글 교과서</h1>
      <p className="mt-3 text-lichen">강좌 지도는 4단계에서 만들어요. 지금은 레슨 목록만 있어요.</p>
      <ol className="mt-10 divide-y divide-moss border-y border-moss">
        {lessons.map((l) => (
          <li key={l.slug} className="py-4">
            {l.status === "공개" ? (
              <Link href={`/lessons/${l.slug}`} className="underline decoration-moss-bright underline-offset-4">
                레슨 {l.order}. {l.title}
              </Link>
            ) : (
              <span className="text-lichen">
                레슨 {l.order}. {l.title} (준비 중)
              </span>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
