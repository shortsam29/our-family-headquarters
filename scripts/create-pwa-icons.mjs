import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const source = "C:/Users/saman/.codex/generated_images/019f8c3c-bb1a-7482-b3c0-8ac8a827f8e9/call_ZE68s8U0YfIAWmFve5aKo8Bq.png";
const output = "C:/Users/saman/OneDrive/Documents/GitHub/our-family-headquarters/public/icons";
await mkdir(output, { recursive: true });

for (const size of [32, 180, 192, 512]) {
  await sharp(source)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(`${output}/icon-${size}.png`);
}

await sharp(source)
  .resize(512, 512, { fit: "contain", background: "#F7F2EA" })
  .extend({ top: 48, bottom: 48, left: 48, right: 48, background: "#F7F2EA" })
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(`${output}/icon-maskable-512.png`);

await sharp(source)
  .resize(720, 720, { fit: "contain", background: "#F7F2EA" })
  .extend({ top: 664, bottom: 664, left: 664, right: 664, background: "#F7F2EA" })
  .resize(2048, 2048)
  .png({ compressionLevel: 9 })
  .toFile(`${output}/splash-2048.png`);
