import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-column px-5 py-20">
      <h1 className="font-display text-title font-bold tracking-tight">찾는 페이지가 없어요</h1>
      <p className="mt-4 text-lichen">아직 준비 중인 레슨이거나, 주소가 바뀌었을 수 있어요.</p>
      <div className="mt-10">
        <ButtonLink href="/">강좌 지도로 가기</ButtonLink>
      </div>
    </main>
  );
}
