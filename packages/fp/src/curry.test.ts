import { describe, it, expect } from "vitest";
import { curry } from './curry';

describe('curry utility function', () => {
  const add = (a: number, b: number, c: number) => a + b + c;
  const curriedAdd = curry(add);

  it('should allow partial application one argument at a time', () => {
    const add5 = curriedAdd(5);
    const add5and10 = add5(10);
    expect(add5and10(15)).toBe(30);
  });

  it('should allow immediate execution with all arguments', () => {
    expect(curriedAdd(1, 2, 3)).toBe(6);
  });

  it('should allow partial application with multiple arguments at once', () => {
    const add15 = curriedAdd(5, 10);
    expect(add15(15)).toBe(30);
  });

  it('should return a function until all arguments are provided', () => {
    expect(typeof curriedAdd(1)).toBe('function');
    expect(typeof curriedAdd(1, 2)).toBe('function');
    expect(typeof curriedAdd(1, 2, 3)).toBe('number'); // The final result
  });

  // Test with a function returning a complex object
  type CalcResult = { sum: number; product: number };
  const calc = (x: number, y: number): CalcResult => ({ sum: x + y, product: x * y });
  const curriedCalc = curry(calc);

  it('should correctly return complex objects after full application', () => {
    expect(curriedCalc(2)(3)).toEqual({ sum: 5, product: 6 });
    expect(curriedCalc(2, 3)).toEqual({ sum: 5, product: 6 });
  });

  // Add tests specifically checking for correct TypeScript inference (more compile-time)
  it('should have correct type inference for partial application', () => {
    const step1 = curriedAdd(1); // Should infer (b: number) => (c: number) => number
    expect(typeof step1).toBe('function');

    const step2 = step1(2); // Should infer (c: number) => number
    expect(typeof step2).toBe('function');

    const final = step2(3); // Should infer number
    expect(typeof final).toBe('number');
  });

  it('should have correct type inference for immediate execution', () => {
    const result = curriedAdd(1, 2, 3); // Should infer number
    expect(typeof result).toBe('number');
  });
});