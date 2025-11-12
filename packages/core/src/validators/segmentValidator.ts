import { Segment } from "../types";
import { createError } from "../utils/errors";

const VALID_SEGMENTS: Segment[] = [
  "ui",
  "model",
  "api",
  "lib",
  "config",
  "types",
];

export function validateSegments(segments: string[]): segments is Segment[] {
  return segments.every((seg) => VALID_SEGMENTS.includes(seg as Segment));
}

export function throwIfInvalidSegments(
  segments: string[]
): asserts segments is Segment[] {
  const invalidSegments = segments.filter(
    (seg) => !VALID_SEGMENTS.includes(seg as Segment)
  );

  if (invalidSegments.length > 0) {
    throw createError(
      "INVALID_SEGMENT",
      `Invalid segment(s): ${invalidSegments.join(", ")}`,
      {
        invalidSegments,
        validSegments: VALID_SEGMENTS,
      }
    );
  }
}

export function normalizeSegments(segments?: string[]): Segment[] {
  if (!segments || segments.length === 0) {
    return ["ui", "model", "api"]; // Default para features
  }

  throwIfInvalidSegments(segments);
  return segments;
}
