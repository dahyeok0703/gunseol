// 트위터 카드 이미지 — OG 이미지와 동일하게 사용.
// runtime 은 재export 가 정적으로 인식되지 않으므로 이 파일에서 직접 선언한다.
import OgImage, { alt, size, contentType } from "./opengraph-image";

export const runtime = "nodejs";
export { alt, size, contentType };
export default OgImage;
