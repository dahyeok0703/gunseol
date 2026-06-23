import "server-only";
import path from "path";
import { Font } from "@react-pdf/renderer";

/**
 * 한글 폰트 임베드 (Noto Sans KR, OFL).
 * public/fonts 의 OTF 를 등록한다 — 출력물에 폰트가 임베드되어 어디서든 동일하게 보인다.
 */
let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoKR",
    fonts: [
      { src: path.join(dir, "NotoSansKR-Regular.otf"), fontWeight: "normal" },
      { src: path.join(dir, "NotoSansKR-Bold.otf"), fontWeight: "bold" },
    ],
  });
  // 한글은 음절 단위 줄바꿈 — 단어 하이픈 분절 비활성화
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
