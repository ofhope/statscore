import { describe, it, expect } from "vitest";
import { linear } from "./linear";
import type { DataPoint } from "./types";

describe("linear", () => {
  it("should correctly calculate linear regression for a perfect positive correlation", () => {
    const data: DataPoint[] = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(1); // gradient
    expect(result.equation[1]).toBeCloseTo(1); // intercept
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = 1x + 1");
    expect(result.predict(5)[1]).toBeCloseTo(6);
    expect(result.points).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
  });

  it("should correctly calculate linear regression for a perfect negative correlation", () => {
    const data: DataPoint[] = [
      [1, 5],
      [2, 4],
      [3, 3],
      [4, 2],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(-1); // gradient
    expect(result.equation[1]).toBeCloseTo(6); // intercept
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = -1x + 6");
    expect(result.predict(5)[1]).toBeCloseTo(1);
  });

  it("should correctly calculate linear regression for a horizontal line", () => {
    const data: DataPoint[] = [
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(0); // gradient
    expect(result.equation[1]).toBeCloseTo(5); // intercept
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = 0x + 5"); // Or 'y = 5' depending on stringification logic
    expect(result.predict(10)[1]).toBeCloseTo(5);
  });

  it("should correctly calculate linear regression for scattered data", () => {
    const data: DataPoint[] = [
      [1, 1],
      [2, 2.5],
      [3, 2.8],
      [4, 4.2],
      [5, 5.1],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    // Manually calculated correct values: y = 0.99x + 0.15, R² = 0.97
    expect(result.equation[0]).toBeCloseTo(0.99); // gradient
    expect(result.equation[1]).toBeCloseTo(0.15); // intercept  
    expect(result.r2).toBeCloseTo(0.97, 2); // R^2
    expect(result.predict(6)[1]).toBeCloseTo(6.09); // 0.99 * 6 + 0.15 = 6.09
  });

  it("should handle negative data points correctly", () => {
    const data: DataPoint[] = [
      [-2, -4],
      [-1, -2],
      [0, 0],
      [1, 2],
      [2, 4],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }
    expect(result.equation[0]).toBeCloseTo(2);
    expect(result.equation[1]).toBeCloseTo(0);
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = 2x");
  });

  it("should handle mixed positive and negative data points correctly", () => {
    const data: DataPoint[] = [
      [-5, 10],
      [0, 0],
      [5, -10],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(-2);
    expect(result.equation[1]).toBeCloseTo(0);
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = -2x");
  });

  it("should apply precision option correctly", () => {
    const data: DataPoint[] = [
      [1, 1.12345],
      [2, 2.12345],
      [3, 3.12345],
    ];
    const result = linear(data, { precision: 2 });

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }
    expect(result.equation[0]).toBeCloseTo(1.0);
    expect(result.equation[1]).toBeCloseTo(0.12);
    expect(result.predict(4)[1]).toBeCloseTo(4.12); // (1.00 * 4) + 0.12
    // R2 might not be exactly 1 due to rounding in points, but should be high
    expect(result.r2).toBeCloseTo(1.0); // For perfectly linear data, R2 remains 1 even with rounding of intercept
  });

  it("should return an error for insufficient data points (less than 2)", () => {
    const data1: DataPoint[] = [];
    const result1 = linear(data1);
    expect(result1.ok).toBe(false);
    if (result1.ok) {
      throw new Error("Expected result1 to be unsuccessful");
    }
    expect(result1.errorType).toBe("InsufficientData");
    expect(result1.message).toContain("at least 2 valid data points");

    const data2: DataPoint[] = [[1, 1]];
    const result2 = linear(data2);
    if (result2.ok) {
      throw new Error("Expected result2 to be unsuccessful");
    }
    expect(result2.errorType).toBe("InsufficientData");
  });

  it("should return an error when all x-values are identical (vertical line)", () => {
    const data: DataPoint[] = [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ];
    const result = linear(data);

    if (result.ok) {
      throw new Error("Expected result to be unsuccessful");
    }
    expect(result.errorType).toBe("DegenerateInput");
    expect(result.message).toContain("all x-values are identical");
  });

  it("should filter out data points with null y-values", () => {
    const data: DataPoint[] = [
      [1, 2],
      [2, null],
      [3, 4],
      [4, null],
      [5, 6],
    ];
    const result = linear(data); // Expects [1,2], [3,4], [5,6] to be used

    console.log("Null filter test - Input data:", data);
    console.log("Null filter test - Result:", result);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(1);
    expect(result.equation[1]).toBeCloseTo(1);
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = 1x + 1");
    // Ensure points array is generated for ALL original x-values, even if y was null
    expect(result.points.length).toBe(data.length);
    expect(result.predict(2)[1]).toBeCloseTo(3); // predict uses the derived equation: 1*2 + 1 = 3
  });

  it("should handle a large number of data points efficiently and accurately", () => {
    const largeData: [number, number][] = [];
    for (let i = 0; i < 10000; i++) {
      largeData.push([i, i * 2 + 3 + Math.random() * 0.1]); // Add some noise
    }

    const result = linear(largeData);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }
    console.log("Large data regression result:", result);

    expect(result.equation[0]).toBeCloseTo(2); // Gradient should be close to 2
    expect(result.equation[1]).toBeCloseTo(3, 1); // Intercept should be close to 3 (with tolerance of 0.05)
    expect(result.r2).toBeGreaterThan(0.99); // R-squared should be very high
  });

  it("should handle data points with zero values", () => {
    const data: DataPoint[] = [
      [0, 0],
      [1, 10],
      [2, 20],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(10);
    expect(result.equation[1]).toBeCloseTo(0);
    expect(result.r2).toBeCloseTo(1);
    expect(result.string).toBe("y = 10x");
  });

  it("should handle very small numbers without precision issues", () => {
    const data: DataPoint[] = [
      [0.0001, 0.0002],
      [0.0002, 0.0004],
      [0.0003, 0.0006],
    ];
    const result = linear(data, { precision: 4 }); // Use higher precision for very small numbers

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(2);
    expect(result.equation[1]).toBeCloseTo(0);
    expect(result.r2).toBeCloseTo(1);
  });

  it("should handle very large numbers without precision issues", () => {
    const data: DataPoint[] = [
      [1e9, 2e9],
      [2e9, 4e9],
      [3e9, 6e9],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(2);
    expect(result.equation[1]).toBeCloseTo(0);
    expect(result.r2).toBeCloseTo(1);
  });

  it("should return insufficient data if only one non-null point after filtering", () => {
    const data: DataPoint[] = [
      [1, 10],
      [2, null],
      [3, null],
    ];
    const result = linear(data);

    if (result.ok) {
      throw new Error("Expected result1 to be unsuccessful");
    }
    expect(result.errorType).toBe("InsufficientData");
  });

  it("predict function should use raw x for calculation, not rounded input x", () => {
    const data: DataPoint[] = [
      [1, 2],
      [2, 3],
    ];
    const result = linear(data, { precision: 0 }); // Set precision to 0 to test rounding impact

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    // Test the core behavior: raw x should be used for calculation, then result is rounded
    // For y = 1x + 1 and predict(1.5):
    // Raw calculation: 1 * 1.5 + 1 = 2.5, then round(2.5, 0) = 3
    expect(result.predict(1.5)[1]).toBe(3);
    
    // Additional test cases to verify raw x is used
    expect(result.predict(0.4)[1]).toBe(1); // 1 * 0.4 + 1 = 1.4 → rounds to 1  
    expect(result.predict(0.6)[1]).toBe(2); // 1 * 0.6 + 1 = 1.6 → rounds to 2
  });

  // R-squared for perfectly horizontal line (y-variance is zero)
  // This case can be tricky. If all y-values are the same, R-squared is technically undefined
  // if the formula requires division by variance_y. However, a perfect fit means R^2 = 1.
  // The determinationCoefficient function needs to handle this.
  it("should have R-squared of 1 for a perfectly horizontal line where all y-values are identical", () => {
    const data: DataPoint[] = [
      [1, 5],
      [2, 5],
      [3, 5],
    ];
    const result = linear(data);

    if (!result.ok) {
      throw new Error("Expected successful regression result");
    }

    expect(result.equation[0]).toBeCloseTo(0);
    expect(result.equation[1]).toBeCloseTo(5);
    expect(result.r2).toBeCloseTo(1); // R^2 should be 1 if the line perfectly fits the data, even if y has no variance
  });
});
