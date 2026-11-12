import { defineConfig } from "vite";

// 화면(정적 파일)만 빌드한다. 결과는 dist/로 가고, wrangler가 이 폴더를 정적 파일로 서빙한다.
export default defineConfig({
  root: "web",
  publicDir: "../public",
  build: { outDir: "../dist", emptyOutDir: true },
});
