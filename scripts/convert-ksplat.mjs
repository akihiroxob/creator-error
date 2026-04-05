import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

globalThis.window = globalThis;

const [, , inputPath, outputPath, compressionArg = "1", alphaArg = "5", shArg = "1"] = process.argv;

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/convert-ksplat.mjs <input.ply> <output.ksplat> [compression=1] [alphaThreshold=5] [sphericalHarmonicsDegree=1]"
  );
  process.exit(1);
}

const compressionLevel = Number(compressionArg);
const minimumAlpha = Number(alphaArg);
const sphericalHarmonicsDegree = Number(shArg);

const plyBytes = await readFile(inputPath);
const fileData = plyBytes.buffer.slice(
  plyBytes.byteOffset,
  plyBytes.byteOffset + plyBytes.byteLength
);

console.log(`Reading ${inputPath} ...`);

const splatBuffer = await GaussianSplats3D.PlyLoader.loadFromFileData(
  fileData,
  minimumAlpha,
  compressionLevel,
  true,
  sphericalHarmonicsDegree
);

console.log(`Writing ${outputPath} ...`);
await writeFile(outputPath, Buffer.from(splatBuffer.bufferData));

console.log("Done.");
