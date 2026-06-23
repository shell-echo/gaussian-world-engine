#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  assertCaptureSessionManifest,
  type CaptureChunkPlan,
  type CaptureSessionManifest,
} from "../../src/builder/CaptureSessionTypes.js";
import {
  createEmptyPoseResult,
  type PoseSolverJob,
} from "../../src/builder/PoseSolverTypes.js";
import type {
  LargeSplatTile,
  LargeSplatTileLod,
  LargeWorldManifest,
} from "../../src/large/LargeWorldTypes.js";
import type { Vec3Tuple } from "../../src/types/world.js";

type CommandHandler = (args: string[]) => Promise<void>;

interface FramePlanSource {
  sourceId: string;
  sourceUrl: string;
  sourceFps: number;
  targetFps: number;
  durationSeconds: number;
  estimatedSourceFrames: number;
  estimatedSelectedFrames: number;
  outputPattern: string;
}

interface FramePlan {
  format: "splat-frame-plan";
  version: 1;
  session: string;
  sources: FramePlanSource[];
}

interface FrameExtractionCommand {
  sourceId: string;
  tool: "ffmpeg";
  command: string;
  outputDirectory: string;
  outputPattern: string;
  expectedFrames: number;
}

interface FrameExtractionPlan {
  format: "splat-frame-extraction-plan";
  version: 1;
  session: string;
  commands: FrameExtractionCommand[];
}

interface ChunkPlanFile {
  format: "splat-chunk-plan";
  version: 1;
  session: string;
  chunks: CaptureChunkPlan[];
}

interface ChunkTrainingJob {
  format: "splat-training-job";
  version: 1;
  session: string;
  chunkId: string;
  tileId: string;
  trainer: CaptureSessionManifest["policy"]["training"]["trainer"];
  frameRange: [number, number];
  input: {
    frameGlob: string;
    poseFile: string;
    maskGlob?: string;
  };
  output: {
    tileDirectory: string;
    lods: LargeSplatTileLod[];
  };
  bounds: CaptureChunkPlan["bounds"];
  training: CaptureSessionManifest["policy"]["training"];
}

interface TrainingJobIndex {
  format: "splat-training-job-index";
  version: 1;
  session: string;
  jobs: Array<{
    chunkId: string;
    tileId: string;
    job: string;
  }>;
}

const commands: Record<string, CommandHandler> = {
  help: async () => printHelp(),
  "init-capture": initCapture,
  validate: validateSession,
  "plan-frames": planFrames,
  "extract-frames": extractFrames,
  "plan-poses": planPoses,
  "plan-chunks": planChunks,
  "write-training-jobs": writeTrainingJobs,
  "export-large-world": exportLargeWorld,
};

async function main(): Promise<void> {
  const [command = "help", ...args] = process.argv.slice(2);
  const handler = commands[command];
  if (!handler) {
    printHelp();
    throw new Error(`Unknown command: ${command}`);
  }
  await handler(args);
}

async function initCapture(args: string[]): Promise<void> {
  const root = path.resolve(requiredArg(args, 0, "capture directory"));
  const name = readOption(args, "--name") ?? path.basename(root);
  const video = readOption(args, "--video") ?? "video/outdoor-loop.mp4";
  const duration = Number(readOption(args, "--duration") ?? 900);

  await mkdir(path.join(root, "video"), { recursive: true });
  await mkdir(path.join(root, "tracks"), { recursive: true });
  await mkdir(path.join(root, "frames"), { recursive: true });
  await mkdir(path.join(root, "poses"), { recursive: true });
  await mkdir(path.join(root, "chunks"), { recursive: true });
  await mkdir(path.join(root, "large-world", "splats"), { recursive: true });
  await mkdir(path.join(root, "large-world", "proxy"), { recursive: true });

  const session: CaptureSessionManifest = {
    format: "splat-capture-session",
    version: 1,
    name,
    createdAt: new Date().toISOString(),
    coordinateSystem: "y-up",
    route: {
      kind: "loop",
      description: "Outdoor loop capture for large Gaussian tile reconstruction.",
      checkpoints: [
        { id: "start-finish", label: "Start and loop closure area", t: 0 },
      ],
    },
    sources: [
      {
        id: "loop-main",
        url: video,
        durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : 900,
        camera: {
          model: "Wide Camera",
          lens: "wide",
          width: 3840,
          height: 2160,
          fps: 30,
          stabilization: "standard",
          rollingShutter: true,
        },
        gpsTrack: "tracks/outdoor-loop.gpx",
        imuTrack: "tracks/outdoor-loop-imu.csv",
      },
    ],
    policy: {
      frames: {
        targetFps: 2,
        minDistanceMeters: 0.75,
        minYawDegrees: 8,
        blurThreshold: 0.55,
        duplicateThreshold: 0.92,
      },
      poses: {
        method: "hybrid",
        loopClosure: true,
        gpsPrior: true,
        imuPrior: true,
        rollingShutterCompensation: true,
      },
      chunks: {
        strategy: "distance",
        chunkMeters: 25,
        overlapRatio: 0.18,
      },
      training: {
        trainer: "external-3dgs",
        maxIterations: 30000,
        targetSplats: 1200000,
        appearanceNormalization: true,
      },
      export: {
        lodLevels: 3,
        highMaxDistance: 35,
        mediumMaxDistance: 90,
        lowMaxDistance: 180,
        gpuBudgetBytes: 384000000,
        outputFormat: "spz",
      },
    },
    expectedOutput: {
      largeWorldManifest: "large-world/world.json",
      assetRoot: "large-world/",
    },
  };

  await writeJson(path.join(root, "session.json"), session);
  console.log(`Created capture session at ${path.join(root, "session.json")}`);
}

async function validateSession(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  console.log(`Valid capture session: ${session.name}`);
  console.log(`Sources: ${session.sources.length}`);
  console.log(`Expected output: ${session.expectedOutput.largeWorldManifest}`);
}

async function planFrames(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const plan = createFramePlan(session, root, sessionPath);
  const output = path.join(root, "frames", "frame-plan.json");
  await writeJson(output, plan);
  console.log(`Wrote frame plan: ${output}`);
}

async function extractFrames(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const framePlan = createFramePlan(session, root, sessionPath);
  const extractionPlan = createFrameExtractionPlan(framePlan);
  const commandFile = path.join(root, "frames", "extract-commands.json");
  const scriptFile = path.join(root, "frames", "extract-frames.sh");

  for (const command of extractionPlan.commands) {
    await mkdir(path.resolve(root, command.outputDirectory), { recursive: true });
  }
  await writeJson(path.join(root, "frames", "frame-plan.json"), framePlan);
  await writeJson(commandFile, extractionPlan);
  await writeFile(scriptFile, createExtractionScript(extractionPlan), "utf8");
  console.log(`Wrote frame extraction plan: ${commandFile}`);
  console.log(`Wrote frame extraction script: ${scriptFile}`);
}

async function planPoses(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const framePlan = createFramePlan(session, root, sessionPath);
  const job = createPoseSolverJob(session, root, sessionPath, framePlan);
  const jobPath = path.join(root, "poses", "pose-job.json");
  const resultPath = path.join(root, "poses", "poses.placeholder.json");
  await writeJson(path.join(root, "frames", "frame-plan.json"), framePlan);
  await writeJson(jobPath, job);
  await writeJson(resultPath, createEmptyPoseResult(job));
  console.log(`Wrote pose solver job: ${jobPath}`);
  console.log(`Wrote placeholder pose result: ${resultPath}`);
}

async function planChunks(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const chunks = createChunkPlan(session);
  const output: ChunkPlanFile = {
    format: "splat-chunk-plan",
    version: 1,
    session: relativePath(root, sessionPath),
    chunks,
  };
  const outputPath = path.join(root, "chunks", "chunk-plan.json");
  await writeJson(outputPath, output);
  console.log(`Wrote chunk plan: ${outputPath}`);
  console.log(`Chunks: ${chunks.length}`);
}

async function writeTrainingJobs(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const chunks = await readChunkPlan(root).catch(() => createChunkPlan(session));
  const index: TrainingJobIndex = {
    format: "splat-training-job-index",
    version: 1,
    session: relativePath(root, sessionPath),
    jobs: [],
  };

  for (const chunk of chunks) {
    const job = createTrainingJob(session, root, sessionPath, chunk);
    const jobPath = path.join(root, "chunks", "jobs", chunk.id, "job.json");
    await writeJson(jobPath, job);
    index.jobs.push({
      chunkId: chunk.id,
      tileId: chunk.expectedTileId,
      job: relativePath(root, jobPath),
    });
  }

  const indexPath = path.join(root, "chunks", "training-jobs.json");
  await writeJson(indexPath, index);
  console.log(`Wrote training job index: ${indexPath}`);
  console.log(`Jobs: ${index.jobs.length}`);
}

async function exportLargeWorld(args: string[]): Promise<void> {
  const sessionPath = path.resolve(requiredArg(args, 0, "session.json"));
  const session = await readSession(sessionPath);
  const root = path.dirname(sessionPath);
  const outputRoot = path.resolve(root, session.expectedOutput.assetRoot);
  const chunks = await readChunkPlan(root).catch(() => createChunkPlan(session));
  const manifest = createLargeWorldManifest(session, chunks);
  const outputPath = path.resolve(root, session.expectedOutput.largeWorldManifest);
  await mkdir(path.join(outputRoot, "splats"), { recursive: true });
  await mkdir(path.join(outputRoot, "proxy"), { recursive: true });
  await writeJson(outputPath, manifest);
  console.log(`Wrote large world manifest: ${outputPath}`);
  console.log(`Tiles: ${manifest.tiles.length}`);
}

function createFramePlan(
  session: CaptureSessionManifest,
  root: string,
  sessionPath: string,
): FramePlan {
  return {
    format: "splat-frame-plan",
    version: 1,
    session: relativePath(root, sessionPath),
    sources: session.sources.map((source) => {
      const durationSeconds = source.durationSeconds ?? 0;
      const selected = Math.max(1, Math.round(durationSeconds * session.policy.frames.targetFps));
      return {
        sourceId: source.id,
        sourceUrl: source.url,
        sourceFps: source.camera.fps,
        targetFps: session.policy.frames.targetFps,
        durationSeconds,
        estimatedSourceFrames: Math.round(durationSeconds * source.camera.fps),
        estimatedSelectedFrames: selected,
        outputPattern: `frames/${source.id}/frame_%06d.jpg`,
      };
    }),
  };
}

function createFrameExtractionPlan(framePlan: FramePlan): FrameExtractionPlan {
  return {
    format: "splat-frame-extraction-plan",
    version: 1,
    session: framePlan.session,
    commands: framePlan.sources.map((source) => {
      const outputDirectory = `frames/${source.sourceId}`;
      const outputPattern = `${outputDirectory}/frame_%06d.jpg`;
      return {
        sourceId: source.sourceId,
        tool: "ffmpeg",
        command: [
          "ffmpeg",
          "-y",
          "-i",
          shellQuote(source.sourceUrl),
          "-vf",
          shellQuote(`fps=${source.targetFps}`),
          "-q:v",
          "2",
          shellQuote(outputPattern),
        ].join(" "),
        outputDirectory,
        outputPattern,
        expectedFrames: source.estimatedSelectedFrames,
      };
    }),
  };
}

function createPoseSolverJob(
  session: CaptureSessionManifest,
  root: string,
  sessionPath: string,
  framePlan: FramePlan,
): PoseSolverJob {
  const firstSource = session.sources[0];
  return {
    format: "splat-pose-solver-job",
    version: 1,
    session: relativePath(root, sessionPath),
    method: session.policy.poses.method,
    coordinateSystem: session.coordinateSystem,
    inputs: {
      frames: framePlan.sources.map((source) => {
        const captureSource = session.sources.find((item) => item.id === source.sourceId) ?? firstSource;
        if (!captureSource) throw new Error(`Missing capture source for ${source.sourceId}.`);
        return {
          sourceId: source.sourceId,
          frameGlob: source.outputPattern.replace("%06d", "*"),
          cameraModel: captureSource.camera.model,
          width: captureSource.camera.width,
          height: captureSource.camera.height,
          fps: captureSource.camera.fps,
        };
      }),
      gpsTrack: firstSource?.gpsTrack,
      imuTrack: firstSource?.imuTrack,
    },
    options: {
      loopClosure: session.policy.poses.loopClosure,
      gpsPrior: session.policy.poses.gpsPrior,
      imuPrior: session.policy.poses.imuPrior,
      rollingShutterCompensation: session.policy.poses.rollingShutterCompensation ?? false,
    },
    output: {
      poses: "poses/poses.json",
      sparsePoints: "poses/sparse-points.json",
      report: "poses/pose-report.json",
    },
  };
}

function createExtractionScript(plan: FrameExtractionPlan): string {
  const lines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    "# Generated by swe-builder. Run from the capture project root.",
  ];
  for (const command of plan.commands) {
    lines.push("", `mkdir -p ${shellQuote(command.outputDirectory)}`, command.command);
  }
  lines.push("");
  return lines.join("\n");
}

function createTrainingJob(
  session: CaptureSessionManifest,
  root: string,
  sessionPath: string,
  chunk: CaptureChunkPlan,
): ChunkTrainingJob {
  return {
    format: "splat-training-job",
    version: 1,
    session: relativePath(root, sessionPath),
    chunkId: chunk.id,
    tileId: chunk.expectedTileId,
    trainer: session.policy.training.trainer,
    frameRange: chunk.frameRange,
    input: {
      frameGlob: "frames/*/frame_*.jpg",
      poseFile: "poses/poses.json",
    },
    output: {
      tileDirectory: `large-world/splats/${chunk.expectedTileId}`,
      lods: createLods(session, chunk.expectedTileId),
    },
    bounds: chunk.bounds ?? fallbackBounds(chunk),
    training: session.policy.training,
  };
}

function createChunkPlan(session: CaptureSessionManifest): CaptureChunkPlan[] {
  const duration = Math.max(...session.sources.map((source) => source.durationSeconds ?? 0), 1);
  const selectedFrames = Math.max(1, Math.round(duration * session.policy.frames.targetFps));
  const chunkMeters = session.policy.chunks.chunkMeters ?? 25;
  const estimatedMeters = Math.max(chunkMeters, duration * 2.8);
  const chunkCount = session.policy.chunks.strategy === "frames"
    ? Math.max(1, Math.ceil(selectedFrames / Math.max(session.policy.chunks.maxFrames ?? 240, 1)))
    : Math.max(1, Math.ceil(estimatedMeters / chunkMeters));
  const framesPerChunk = Math.ceil(selectedFrames / chunkCount);

  return Array.from({ length: chunkCount }, (_, index) => {
    const id = `chunk_${index.toString().padStart(4, "0")}`;
    const tile = `tile_${index.toString().padStart(4, "0")}`;
    const start = index * framesPerChunk;
    const end = Math.min(selectedFrames - 1, (index + 1) * framesPerChunk - 1);
    const minX = index * chunkMeters - chunkMeters * session.policy.chunks.overlapRatio;
    const maxX = (index + 1) * chunkMeters + chunkMeters * session.policy.chunks.overlapRatio;
    return {
      id,
      frameRange: [start, Math.max(start, end)] as [number, number],
      expectedTileId: tile,
      bounds: {
        min: [minX, -4, -18],
        max: [maxX, 12, 18],
      },
      overlapWith: [index > 0 ? `chunk_${(index - 1).toString().padStart(4, "0")}` : ""].filter(Boolean),
    };
  });
}

function createLargeWorldManifest(
  session: CaptureSessionManifest,
  chunks: readonly CaptureChunkPlan[],
): LargeWorldManifest {
  const tiles: LargeSplatTile[] = chunks.map((chunk) => ({
    id: chunk.expectedTileId,
    bounds: chunk.bounds ?? fallbackBounds(chunk),
    lods: createLods(session, chunk.expectedTileId),
    neighbors: chunks
      .filter((candidate) => candidate.overlapWith?.includes(chunk.id) || chunk.overlapWith?.includes(candidate.id))
      .map((candidate) => candidate.expectedTileId),
  }));

  return {
    format: "splatworld-large",
    version: 1,
    name: session.name,
    spawn: {
      position: [0, 0.05, 6],
      yawDeg: 0,
    },
    streaming: {
      loadRadius: session.policy.export.highMaxDistance + 10,
      unloadRadius: session.policy.export.mediumMaxDistance + 30,
      preloadRadius: session.policy.export.lowMaxDistance ?? session.policy.export.mediumMaxDistance + 80,
      gpuBudgetBytes: session.policy.export.gpuBudgetBytes,
      maxConcurrentLoads: 2,
      debugBounds: true,
      lodHysteresisRatio: 0.14,
      minLodDwellSeconds: 1.2,
    },
    colliders: [],
    tiles,
  };
}

function createLods(
  session: CaptureSessionManifest,
  tileId: string,
): LargeSplatTileLod[] {
  const extension = session.policy.export.outputFormat;
  const levels = Math.max(1, Math.round(session.policy.export.lodLevels));
  const distances = [
    session.policy.export.highMaxDistance,
    session.policy.export.mediumMaxDistance,
    session.policy.export.lowMaxDistance ?? session.policy.export.mediumMaxDistance * 2,
  ];
  return Array.from({ length: levels }, (_, level) => ({
    level,
    url: `splats/${tileId}_lod${level}.${extension}`,
    maxDistance: distances[Math.min(level, distances.length - 1)] ?? distances[distances.length - 1] ?? 90,
    bytes: Math.max(1, Math.round((session.policy.training.targetSplats ?? 1_000_000) * 32 / Math.max(level + 1, 1))),
  }));
}

async function readChunkPlan(root: string): Promise<CaptureChunkPlan[]> {
  const file = await readJson(path.join(root, "chunks", "chunk-plan.json"));
  const plan = file as Partial<ChunkPlanFile>;
  if (plan.format !== "splat-chunk-plan" || !Array.isArray(plan.chunks)) {
    throw new Error("Invalid chunk plan.");
  }
  return plan.chunks;
}

async function readSession(sessionPath: string): Promise<CaptureSessionManifest> {
  const value = await readJson(sessionPath);
  assertCaptureSessionManifest(value);
  return value;
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function fallbackBounds(chunk: CaptureChunkPlan): { min: Vec3Tuple; max: Vec3Tuple } {
  const index = Number.parseInt(chunk.expectedTileId.replace(/\D+/g, ""), 10) || 0;
  return {
    min: [index * 25, -4, -18],
    max: [(index + 1) * 25, 12, 18],
  };
}

function requiredArg(args: readonly string[], index: number, label: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing ${label}.`);
  return value;
}

function readOption(args: readonly string[], key: string): string | undefined {
  const index = args.indexOf(key);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function relativePath(root: string, target: string): string {
  return path.relative(root, target).replaceAll(path.sep, "/") || path.basename(target);
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function printHelp(): void {
  console.log(`swe-builder

Usage:
  swe-builder init-capture <dir> [--name <name>] [--video <path>] [--duration <seconds>]
  swe-builder validate <session.json>
  swe-builder plan-frames <session.json>
  swe-builder extract-frames <session.json>
  swe-builder plan-poses <session.json>
  swe-builder plan-chunks <session.json>
  swe-builder write-training-jobs <session.json>
  swe-builder export-large-world <session.json>

This scaffold prepares files and manifests for an offline Gaussian builder. It writes ffmpeg extraction scripts, pose solver jobs and per-chunk training job manifests, but it does not run COLMAP, SLAM, ffmpeg or 3DGS training automatically yet.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`swe-builder: ${message}`);
  process.exitCode = 1;
});
