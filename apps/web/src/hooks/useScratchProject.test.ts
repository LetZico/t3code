import { EnvironmentId } from "@t3tools/contracts";
import { describe, expect, it, vi } from "vite-plus/test";

const state = vi.hoisted(() => ({
  environments: [] as Array<{
    environmentId: string;
    connection: { phase: string };
    serverConfig: { scratchWorkspaceRoot: string | null };
  }>,
}));

vi.mock("../state/environments", () => ({
  useEnvironments: () => ({ environments: state.environments }),
}));
vi.mock("../state/use-atom-command", () => ({ useAtomCommand: () => async () => undefined }));
vi.mock("./useHandleNewThread", () => ({ useNewThreadHandler: () => async () => undefined }));

import { useScratchProject } from "./useScratchProject";

const LOCAL = EnvironmentId.make("local");
const REMOTE = EnvironmentId.make("remote");
const OTHER = EnvironmentId.make("other");

function environment(environmentId: EnvironmentId, phase: string) {
  return {
    environmentId,
    connection: { phase },
    serverConfig: { scratchWorkspaceRoot: `/scratch/${environmentId}` },
  };
}

describe("useScratchProject", () => {
  it("falls back to the sole connected machine when the current one is unavailable", () => {
    state.environments = [environment(REMOTE, "reconnecting"), environment(LOCAL, "connected")];
    expect(useScratchProject().scratchEnvironmentId(REMOTE)).toBe(LOCAL);

    state.environments = [environment(REMOTE, "connected"), environment(LOCAL, "connected")];
    expect(useScratchProject().scratchEnvironmentId(REMOTE)).toBe(REMOTE);

    state.environments = [
      environment(REMOTE, "reconnecting"),
      environment(LOCAL, "connected"),
      environment(OTHER, "connected"),
    ];
    expect(useScratchProject().scratchEnvironmentId(REMOTE)).toBeNull();
  });
});
