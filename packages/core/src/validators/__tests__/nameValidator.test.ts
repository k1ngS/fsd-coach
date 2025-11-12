import { describe, it, expect } from "vitest";
import { validateSliceName, throwIfInvalidName } from "../nameValidator";
import { FSDCoachError } from "../../utils/errors";

describe("nameValidator", () => {
  describe("validateSliceName", () => {
    it("should accept valid kebab-case names", () => {
      const validNames = [
        "auth",
        "user-profile",
        "create-campaign",
        "send-email-notification",
        "api-client",
        "auth123",
      ];

      validNames.forEach((name) => {
        const result = validateSliceName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject empty names", () => {
      const result = validateSliceName("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Name cannot be empty");
    });

    it("should reject names with whitespace only", () => {
      const result = validateSliceName("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Name cannot be empty");
    });

    it("should reject names starting with numbers", () => {
      const result = validateSliceName("123auth");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lowercase letter");
    });

    it("should reject names with uppercase letters", () => {
      const result = validateSliceName("Auth");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lowercase");
    });

    it("should reject names with underscores", () => {
      const result = validateSliceName("user_profile");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lowercase");
    });

    it("should reject names with spaces", () => {
      const result = validateSliceName("user profile");
      expect(result.valid).toBe(false);
    });

    it("should reject names with consecutive hyphens", () => {
      const result = validateSliceName("user--profile");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("consecutive hyphens");
    });

    it("should reject names ending with hyphen", () => {
      const result = validateSliceName("user-profile-");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("end with a hyphen");
    });

    it("should reject names that are too long", () => {
      const longName = "a".repeat(51);
      const result = validateSliceName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("50 characters");
    });

    it("should reject reserved words", () => {
      const reservedWords = ["index", "test", "types", "config"];

      reservedWords.forEach((word) => {
        const result = validateSliceName(word);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("reserved word");
      });
    });
  });

  describe("throwIfInvalidName", () => {
    it("should not throw for valid names", () => {
      expect(() => throwIfInvalidName("auth", "feature")).not.toThrow();
      expect(() => throwIfInvalidName("user-profile", "entity")).not.toThrow();
    });

    it("should throw FSDCoachError for invalid names", () => {
      expect(() => throwIfInvalidName("", "feature")).toThrow(FSDCoachError);
      expect(() => throwIfInvalidName("Auth", "entity")).toThrow(FSDCoachError);
      expect(() => throwIfInvalidName("user_profile", "widget")).toThrow(
        FSDCoachError
      );
    });

    it("should include context in error", () => {
      try {
        throwIfInvalidName("InvalidName", "feature");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FSDCoachError);
        const fsdError = error as FSDCoachError;
        expect(fsdError.context?.providedName).toBe("InvalidName");
        expect(fsdError.context?.type).toBe("feature");
      }
    });
  });
});
