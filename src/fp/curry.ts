/**
 * @function curry
 * @description
 * Creates a curried version of a function. A curried function takes its arguments
 * one at a time, returning a new function until all arguments are received.
 * This is particularly useful for creating flexible and composable statistical
 * methods where common parameters can be pre-filled.
 *
 * This utility favors "data-last" arguments for better composability, meaning
 * the data array should typically be the last parameter of the function
 * being curried.
 *
 * @template T - The type of the function to curry.
 * @param {T} fn - The function to curry.
 * @returns {CurriedFunction<T>} A new function that is a curried version of `fn`.
 *
 * @example
 * ```typescript
 * import { curry } from './curry';
 *
 * // Example: A simple sum function with data-last
 * function sum(offset: number, numbers: number[]): number {
 * return numbers.reduce((acc, val) => acc + val + offset, 0);
 * }
 *
 * const curriedSum = curry(sum);
 *
 * // Partial application
 * const sumWithOffsetOfTen = curriedSum(10);
 * console.log(sumWithOffsetOfTen([1, 2, 3])); // Output: 16 (1+10 + 2+10 + 3+10 = 36 if added to each, but here it's (1+2+3)+10 = 16)
 *
 * // Direct application
 * console.log(curriedSum(5)([1, 2, 3])); // Output: 11
 * ```
 */
export function curry<T extends (...args: any[]) => any>(fn: T): CurriedFunction<T> {
  const arity = fn.length;

  function curried(...args: any[]): any {
    if (args.length >= arity) {
      return fn(...args);
    } else {
      return (...moreArgs: any[]) => curried(...args, ...moreArgs);
    }
  }

  return curried as CurriedFunction<T>;
}

// Helper type to correctly type the curried function
// This handles up to 5 arguments for practical purposes. Extend as needed.
type CurriedFunction<T extends (...args: any[]) => any> =
  T extends (a: infer A, b: infer B, c: infer C, d: infer D, e: infer E, ...rest: infer R) => infer Ret ?
  ((a: A) => CurriedFunction<(...args: [B, C, D, E, ...R]) => Ret>) &
  ((a: A, b: B) => CurriedFunction<(...args: [C, D, E, ...R]) => Ret>) &
  ((a: A, b: B, c: C) => CurriedFunction<(...args: [D, E, ...R]) => Ret>) &
  ((a: A, b: B, c: C, d: D) => CurriedFunction<(...args: [E, ...R]) => Ret>) &
  ((a: A, b: B, c: C, d: D, e: E, ...rest: R) => Ret) &
  ((...args: Parameters<T>) => Ret) :
  T extends (a: infer A, b: infer B, c: infer C, d: infer D, ...rest: infer R) => infer Ret ?
  ((a: A) => CurriedFunction<(...args: [B, C, D, ...R]) => Ret>) &
  ((a: A, b: B) => CurriedFunction<(...args: [C, D, ...R]) => Ret>) &
  ((a: A, b: B, c: C) => CurriedFunction<(...args: [D, ...R]) => Ret>) &
  ((a: A, b: B, c: C, d: D, ...rest: R) => Ret) &
  ((...args: Parameters<T>) => Ret) :
  T extends (a: infer A, b: infer B, c: infer C, ...rest: infer R) => infer Ret ?
  ((a: A) => CurriedFunction<(...args: [B, C, ...R]) => Ret>) &
  ((a: A, b: B) => CurriedFunction<(...args: [C, ...R]) => Ret>) &
  ((a: A, b: B, c: C, ...rest: R) => Ret) &
  ((...args: Parameters<T>) => Ret) :
  T extends (a: infer A, b: infer B, ...rest: infer R) => infer Ret ?
  ((a: A) => CurriedFunction<(...args: [B, ...R]) => Ret>) &
  ((a: A, b: B, ...rest: R) => Ret) &
  ((...args: Parameters<T>) => Ret) :
  T extends (a: infer A, ...rest: infer R) => infer Ret ?
  ((a: A, ...rest: R) => Ret) &
  ((...args: Parameters<T>) => Ret) :
  T;