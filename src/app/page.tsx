import { CourseMap } from "@/components/home/CourseMap";
import { SaveNotice } from "@/components/progress/SaveNotice";
import { getLessons } from "@/lib/content/load";
import { toCourseLessons } from "@/lib/content/view";

export default async function Home() {
  const lessons = toCourseLessons(await getLessons());

  return (
    <main className="mx-auto max-w-column px-5 pb-20 pt-14 sm:pt-20">
      <SaveNotice className="mb-10" />

      <h1 className="font-display text-title-lg font-bold tracking-tight">정글 교과서</h1>
      <div className="mt-5 space-y-3 text-subheading">
        <p>
          정글을 처음 하면 세 가지가 막막해요. 어디서 시작할지, 지금 뭘 할지, 적 정글러가 어디 있는지.
        </p>
        <p className="text-lichen">레슨을 읽고, 상황 퀴즈에서 직접 골라 보면서 익혀요. 고르면 바로 이유를 알려 줘요.</p>
      </div>

      <div className="mt-14">
        <CourseMap lessons={lessons} />
      </div>
    </main>
  );
}
