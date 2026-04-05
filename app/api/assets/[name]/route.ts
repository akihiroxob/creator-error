import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const ASSET_MAP = {
  "3sdgs_room.ply": {
    fileName: "3sdgs_room.ply",
    contentType: "application/octet-stream"
  },
  "room_edit.glb": {
    fileName: "room_edit.glb",
    contentType: "model/gltf-binary"
  },
  "3sdgs_room.ksplat": {
    fileName: "3sdgs_room.ksplat",
    contentType: "application/octet-stream"
  }
} as const;

type AssetName = keyof typeof ASSET_MAP;

function isAssetName(value: string): value is AssetName {
  return value in ASSET_MAP;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  if (!isAssetName(name)) {
    return new Response("Not found", { status: 404 });
  }

  const asset = ASSET_MAP[name];
  const assetPath = path.join(process.cwd(), asset.fileName);
  const assetStat = await stat(assetPath);
  const stream = createReadStream(assetPath);

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "content-length": String(assetStat.size),
      "content-type": asset.contentType,
      "cache-control": "public, max-age=3600"
    }
  });
}
