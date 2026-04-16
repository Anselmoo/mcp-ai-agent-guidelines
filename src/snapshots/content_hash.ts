// ─── content_hash.ts ─────────────────────────────────────────────────────────
// Mirrors LSPFileBuffer.content_hash — MD5 of file bytes.
// Python: hashlib.md5(self.contents.encode(self.encoding)).hexdigest()

import { createHash } from "node:crypto";

export function computeContentHash(
	content: string,
	encoding: BufferEncoding = "utf8",
): string {
	return createHash("md5").update(Buffer.from(content, encoding)).digest("hex");
}
