import type { LessonViewData } from "@/lib/content/view";
import { reviewLabel } from "@/lib/content/view";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { josa } from "@/lib/korean";

export function SummaryStep({ lesson }: { lesson: LessonViewData }) {
  const { next } = lesson;
  const hasNext = next?.available === true;

  return (
    <article>
      <h1 className="font-display text-title font-bold tracking-tight sm:text-title-lg">세 줄 요약</h1>
      <p className="mt-3 text-lichen">
        「{lesson.title}」{josa(lesson.title, "을/를")} 정리했어요.
      </p>

      <ul className="mt-8 divide-y divide-moss border-y border-moss">
        {lesson.summary.map((line, i) => (
          <li key={i} className="py-5 text-subheading">
            {line}
          </li>
        ))}
      </ul>

      <section aria-labelledby="evidence-heading" className="mt-14">
        <h2 id="evidence-heading" className="font-display text-heading font-bold">
          출처와 검수
        </h2>
        <p className="mt-2 text-small text-lichen">
          이 레슨은 아래 자료를 바탕으로 썼어요. 믿어도 되는지 직접 확인해 보세요.
        </p>

        <ul className="mt-6 space-y-4">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-moss-bright underline-offset-4 hover:decoration-bone"
              >
                {s.title}
              </a>
              <p className="text-small text-lichen">{s.checkedAt}에 확인</p>
            </li>
          ))}
        </ul>

        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-canopy px-4 py-4 text-small">
          <dt className="text-lichen">검증 패치</dt>
          <dd>{lesson.verifiedPatch ?? "패치에 따라 바뀌는 정보 없음"}</dd>
          <dt className="text-lichen">검수</dt>
          <dd>{reviewLabel(lesson.review)}</dd>
        </dl>
      </section>

      <nav aria-label="다음으로" className="mt-14 border-t border-moss pt-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          {hasNext && <ButtonLink href={`/lessons/${next.slug}`}>다음 레슨 보기</ButtonLink>}
          <ButtonLink variant={hasNext ? "secondary" : "primary"} href="/">
            강좌 지도로 돌아가기
          </ButtonLink>
        </div>
        {next && !next.available && (
          <p className="mt-4 text-small text-lichen">
            다음 레슨 「{next.title}」{josa(next.title, "은/는")} 준비 중이에요.
          </p>
        )}
      </nav>
    </article>
  );
}
