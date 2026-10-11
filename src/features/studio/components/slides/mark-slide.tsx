/* eslint-disable @next/next/no-img-element */
export function MarkSlide({ markUrl }: { markUrl: string }) {
  return <img src={markUrl} alt="Logo mark" className="absolute inset-0 m-auto h-[70%] w-auto object-contain" />;
}
