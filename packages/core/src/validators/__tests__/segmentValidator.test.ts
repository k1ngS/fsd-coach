import { describe, it, expect } from "vitest";
import {
  validateSegments,
  throwIfInvalidSegments,
  normalizeSegments,
} from "../segmentValidator";
import { FSDCoachError } from "../../utils/errors";

describe("segmentValidator", () => {
  describe("validateSegments", () => {
    it("should accept valid segments", () => {
      expect(validateSegments(["ui", "model", "api"])).toBe(true);
      expect(validateSegments(["lib"])).toBe(true);
      expect(
        validateSegments(["ui", "model", "api", "lib", "config", "types"])
      ).toBe(true);
    });

    it("should reject invalid segments", () => {
      expect(validateSegments(["invalid"])).toBe(false);
      expect(validateSegments(["ui", "invalid"])).toBe(false);
      expect(validateSegments(["UI"])).toBe(false);
    });

    it("should handle empty array", () => {
      expect(validateSegments([])).toBe(true);
    });
  });

  describe("throwIfInvalidSegments", () => {
    it("should not throw for valid segments", () => {
      expect(() => throwIfInvalidSegments(["ui", "model"])).not.toThrow();
    });

    it("should throw FSDCoachError for invalid segments", () => {
      expect(() => throwIfInvalidSegments(["invalid"])).toThrow(FSDCoachError);
      expect(() => throwIfInvalidSegments(["ui", "invalid", "model"])).toThrow(
        FSDCoachError
      );
    });

    it("should include all invalid segments in error", () => {
      try {
        throwIfInvalidSegments(["ui", "invalid1", "model", "invalid2"]);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FSDCoachError);
        const fsdError = error as FSDCoachError;
        expect(fsdError.context?.invalidSegments).toEqual([
          "invalid1",
          "invalid2",
        ]);
      }
    });
  });

  describe("normalizeSegments", () => {
    it("should return default segments when input is undefined", () => {
      const result = normalizeSegments();
      expect(result).toEqual(["ui", "model", "api"]);
    });

    it("should return default segments when input is empty array", () => {
      const result = normalizeSegments([]);
      expect(result).toEqual(["ui", "model", "api"]);
    });

    it("should return provided segments when valid", () => {
      const result = normalizeSegments(["ui", "lib"]);
      expect(result).toEqual(["ui", "lib"]);
    });

    it("should throw for invalid segments", () => {
      expect(() => normalizeSegments(["invalid"])).toThrow(FSDCoachError);
    });
  });
});
