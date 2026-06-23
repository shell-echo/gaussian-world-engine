import type { PoseSolverJob } from "./PoseSolverTypes.js";

export interface ColmapRunnerCommand {
  id: string;
  description: string;
  command: string[];
}

export interface ColmapRunnerPlan {
  format: "splat-colmap-runner-plan";
  version: 1;
  poseJob: string;
  workDir: string;
  imagePath: string;
  databasePath: string;
  sparsePath: string;
  textModelPath: string;
  output: PoseSolverJob["output"];
  commands: ColmapRunnerCommand[];
}

export interface ColmapRunnerReport {
  format: "splat-colmap-runner-report";
  version: 1;
  plan: string;
  status: "pending" | "running" | "completed" | "failed";
  message: string;
  expectedOutputs: PoseSolverJob["output"];
}

export function createColmapRunnerPlan(
  poseJobPath: string,
  job: PoseSolverJob,
): ColmapRunnerPlan {
  const imagePath = "frames";
  const databasePath = "poses/colmap/database.db";
  const sparsePath = "poses/colmap/sparse";
  const textModelPath = "poses/colmap/model-text";
  return {
    format: "splat-colmap-runner-plan",
    version: 1,
    poseJob: poseJobPath,
    workDir: "poses/colmap",
    imagePath,
    databasePath,
    sparsePath,
    textModelPath,
    output: job.output,
    commands: [
      {
        id: "feature-extractor",
        description: "Extract local features for selected frames.",
        command: [
          "colmap",
          "feature_extractor",
          "--database_path",
          databasePath,
          "--image_path",
          imagePath,
          "--ImageReader.single_camera",
          "0",
        ],
      },
      {
        id: "exhaustive-matcher",
        description: "Match frame features. Replace with sequential/vocab matching for larger captures.",
        command: [
          "colmap",
          "exhaustive_matcher",
          "--database_path",
          databasePath,
        ],
      },
      {
        id: "mapper",
        description: "Solve sparse camera poses and 3D points.",
        command: [
          "colmap",
          "mapper",
          "--database_path",
          databasePath,
          "--image_path",
          imagePath,
          "--output_path",
          sparsePath,
        ],
      },
      {
        id: "model-converter",
        description: "Export COLMAP sparse model to text files for adapter conversion.",
        command: [
          "colmap",
          "model_converter",
          "--input_path",
          `${sparsePath}/0`,
          "--output_path",
          textModelPath,
          "--output_type",
          "TXT",
        ],
      },
    ],
  };
}

export function createColmapRunnerReport(plan: ColmapRunnerPlan): ColmapRunnerReport {
  return {
    format: "splat-colmap-runner-report",
    version: 1,
    plan: "poses/colmap/colmap-runner.json",
    status: "pending",
    message: "Generated placeholder. Run the COLMAP script and then convert the model into splat-pose-result.",
    expectedOutputs: plan.output,
  };
}
