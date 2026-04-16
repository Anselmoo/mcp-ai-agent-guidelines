import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decode as toonDecode } from "@toon-format/toon";
import { beforeEach, describe, expect, it } from "vitest";
import { ToonMemoryInterface } from "../../memory/toon-interface.js";

describe("ToonMemoryInterface coherence integration", () => {
	let dir: string;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "toonmemtest-"));
		rmSync(dir, { recursive: true, force: true });
	});

	it("refresh writes fingerprint-latest.toon and compare is clean", async () => {
		const iface = new ToonMemoryInterface(dir);
		await iface.refresh();
		const snapPath = join(dir, "snapshots", "fingerprint-latest.json");
		expect(existsSync(snapPath)).toBe(true);
		const { drift, toon } = await iface.compare();
		expect(drift.clean).toBe(true);
		const roundTrip = toonDecode(toon);
		expect(roundTrip).toMatchObject(drift);
	});
});
