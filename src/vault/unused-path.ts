import { VaultPort } from "./port";
import { normalizeVaultPath } from "./paths";

/** The preferred path, or a -2/-3/… suffixed variant when a note already sits there. */
export async function unusedPath(port: VaultPort, preferredPath: string): Promise<string> {
    const normalized = normalizeVaultPath(preferredPath);
    if (!(await port.exists(normalized))) return normalized;

    const dot = normalized.lastIndexOf(".");
    const stem = dot === -1 ? normalized : normalized.slice(0, dot);
    const ext = dot === -1 ? "" : normalized.slice(dot);
    for (let i = 2; i < 1000; i++) {
        const candidate = `${stem}-${i}${ext}`;
        if (!(await port.exists(candidate))) return candidate;
    }
    throw new Error(`Could not find an unused path for ${normalized}`);
}
