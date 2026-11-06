// 퀴즈에서 쓰는 작은 아이콘. 모두 장식용이라 화면 읽기 프로그램에는 숨기고, 뜻은 옆 글자로 전한다.
const base = { "aria-hidden": true, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

export const ClockIcon = ({ className = "size-4" }) => (
  <svg {...base} className={className}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6.5V10l2.5 1.5" strokeLinecap="round" />
  </svg>
);

export const EyeIcon = ({ className = "size-4" }) => (
  <svg {...base} className={className}>
    <path d="M2.5 10S5 4.75 10 4.75 17.5 10 17.5 10 15 15.25 10 15.25 2.5 10 2.5 10Z" />
    <circle cx="10" cy="10" r="2.25" />
  </svg>
);

export const EyeOffIcon = ({ className = "size-4" }) => (
  <svg {...base} className={className}>
    <path d="M4.2 6.6C3 7.9 2.5 10 2.5 10S5 15.25 10 15.25c1.4 0 2.6-.4 3.6-1M8 4.95c.6-.13 1.3-.2 2-.2 5 0 7.5 5.25 7.5 5.25s-.5 1.05-1.5 2.3" />
    <path d="M3 3l14 14" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className = "size-4" }) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M4.5 10.5 8.5 14l7-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon = ({ className = "size-4" }) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" strokeLinecap="round" />
  </svg>
);

export const ChevronDownIcon = ({ className = "size-4" }) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
