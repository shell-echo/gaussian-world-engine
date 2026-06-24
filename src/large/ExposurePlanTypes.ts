export type ColorTriplet = [number, number, number];

export interface TileExposureAdjustment {
  tileId: string;
  exposureStops: number;
  gain: ColorTriplet;
  bias: ColorTriplet;
}

export interface ExposurePlan {
  format: "splat-exposure-plan";
  version: 1;
  session: string;
  adjustments: TileExposureAdjustment[];
}

export function assertExposurePlan(value: unknown): asserts value is ExposurePlan {
  if (!value || typeof value !== "object") throw new Error("Exposure plan must be an object.");
  const plan = value as Partial<ExposurePlan>;
  if (plan.format !== "splat-exposure-plan" || plan.version !== 1) {
    throw new Error("Unsupported exposure plan format/version.");
  }
  if (typeof plan.session !== "string") throw new Error("Exposure plan is missing a session path.");
  if (!Array.isArray(plan.adjustments)) throw new Error("Exposure plan needs adjustments.");
  const ids = new Set<string>();
  for (const adjustment of plan.adjustments) {
    assertTileExposureAdjustment(adjustment);
    if (ids.has(adjustment.tileId)) throw new Error(`Duplicate exposure adjustment for ${adjustment.tileId}.`);
    ids.add(adjustment.tileId);
  }
}

export function exposurePlanToMap(plan: ExposurePlan): Map<string, TileExposureAdjustment> {
  return new Map(plan.adjustments.map((adjustment) => [adjustment.tileId, adjustment] as const));
}

function assertTileExposureAdjustment(value: unknown): asserts value is TileExposureAdjustment {
  if (!value || typeof value !== "object") throw new Error("Invalid exposure adjustment.");
  const adjustment = value as Partial<TileExposureAdjustment>;
  if (typeof adjustment.tileId !== "string" || !adjustment.tileId.trim()) {
    throw new Error("Exposure adjustment is missing tileId.");
  }
  if (!isFiniteNumber(adjustment.exposureStops)) {
    throw new Error(`Exposure adjustment ${adjustment.tileId} has invalid exposureStops.`);
  }
  if (!isColorTriplet(adjustment.gain)) {
    throw new Error(`Exposure adjustment ${adjustment.tileId} has invalid gain.`);
  }
  if (!isColorTriplet(adjustment.bias)) {
    throw new Error(`Exposure adjustment ${adjustment.tileId} has invalid bias.`);
  }
}

function isColorTriplet(value: unknown): value is ColorTriplet {
  return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
