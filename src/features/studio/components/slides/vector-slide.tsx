/* eslint-disable @next/next/no-img-element */
import { Download } from 'lucide-react';

export function VectorSlide({ svgUrl, name }: { svgUrl: string; name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[length:4cqw_4cqw] bg-[linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%),linear-gradient(45deg,#f1f1f1_25%,transparent_25%,transparent_75%,#f1f1f1_75%)] bg-[position:0_0,2cqw_2cqw]">
      <img src={svgUrl} alt="Vector mark" className="h-[55%] w-auto" />
      <a href={svgUrl} download={`${name}-mark.svg`} target="_blank" rel="noreferrer"
        className="absolute bottom-[3cqw] right-[3cqw] flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs text-white">
        <Download className="h-3 w-3" /> SVG
      </a>
    </div>
  );
}
