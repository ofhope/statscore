/**
 * Type to represent the head (first element) of a tuple.
 */
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;

/**
 * Type to represent the tail (rest of the elements) of a tuple.
 */
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : [];

/**
 * Type to represent a function's arguments.
 */
type Args<T> = T extends (...args: infer A) => any ? A : never;

/**
 * Type to represent a function's return type.
 */
type Return<T> = T extends (...args: any[]) => infer R ? R : any;

/**
 * Recursive type for a curried function that handles all possible partial applications.
 * This type creates overloads for every possible way to split the arguments.
 */
type Curried<A extends any[], R> = A extends []
  ? () => R
  : A extends [any]
  ? ((...args: A) => R) // Only one argument left, just execute
  : A extends [any, any]
  ? ((arg1: A[0]) => Curried<[A[1]], R>) & // Take 1, leave 1
    ((...args: A) => R) // Take all 2
  : A extends [any, any, any]
  ? ((arg1: A[0]) => Curried<[A[1], A[2]], R>) & // Take 1, leave 2
    ((arg1: A[0], arg2: A[1]) => Curried<[A[2]], R>) & // Take 2, leave 1
    ((...args: A) => R) // Take all 3
  : A extends [any, any, any, any]
  ? ((arg1: A[0]) => Curried<[A[1], A[2], A[3]], R>) & // Take 1, leave 3
    ((arg1: A[0], arg2: A[1]) => Curried<[A[2], A[3]], R>) & // Take 2, leave 2
    ((arg1: A[0], arg2: A[1], arg3: A[2]) => Curried<[A[3]], R>) & // Take 3, leave 1
    ((...args: A) => R) // Take all 4
  : A extends [any, any, any, any, any]
  ? ((arg1: A[0]) => Curried<[A[1], A[2], A[3], A[4]], R>) & // Take 1, leave 4
    ((arg1: A[0], arg2: A[1]) => Curried<[A[2], A[3], A[4]], R>) & // Take 2, leave 3
    ((arg1: A[0], arg2: A[1], arg3: A[2]) => Curried<[A[2], A[3]], R>) & // Take 3, leave 2
    ((arg1: A[0], arg2: A[1], arg3: A[2], arg4: A[3]) => Curried<[A[4]], R>) & // Take 4, leave 1
    ((...args: A) => R) // Take all 5
  : // Fallback for more than 5 arguments - use the original simpler approach
    ((arg: Head<A>) => Curried<Tail<A>, R>) & ((...args: A) => R);

/**
 * @function curry
 * @description
 * Creates a curried version of a function. A curried function can be called
 * with all arguments at once for immediate execution, or with arguments
 * one at a time (or in chunks) for partial application, returning new
 * functions until all arguments are received.
 *
 * This utility favors "data-last" arguments for better composability, meaning
 * the data array should typically be the last parameter of the function
 * being curried.
 *
 * @template T - The type of the function to curry.
 * @param {T} fn - The function to curry.
 * @returns {Curried<Args<T>, Return<T>>} A new function that is a curried version of `fn`.
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
 * // Partial application (curried form)
 * const sumWithOffsetOfTen = curriedSum(10);
 * console.log(sumWithOffsetOfTen([1, 2, 3])); // Output: 16
 *
 * // Immediate execution (all arguments at once)
 * console.log(curriedSum(5, [1, 2, 3])); // Output: 11
 *
 * // Example with a function returning a complex type (like LinearRegressionResult)
 * type Point = { x: number; y: number };
 * type RegressionResult = { ok: boolean, m?: number, b?: number, error?: string };
 *
 * function _calculateRegression(options: { includeRSquared: boolean }, data: Point[]): RegressionResult {
 * // ... actual calculation logic ...
 * return { ok: true, m: 1, b: 0 };
 * }
 *
 * const calculateRegression = curry(_calculateRegression);
 *
 * // Partial application
 * const regressionWithRSquared = calculateRegression({ includeRSquared: true });
 * const resultPartial = regressionWithRSquared([{ x: 1, y: 1 }]);
 * console.log(resultPartial);
 *
 * // Immediate execution
 * const resultImmediate = calculateRegression({ includeRSquared: false }, [{ x: 1, y: 1 }]);
 * console.log(resultImmediate);
 * ```
 */
export function curry<T extends (...args: any[]) => any>(fn: T): Curried<Args<T>, Return<T>> {
  const arity = fn.length;

  function curried(...args: any[]): any {
    // If the number of arguments provided in this call is sufficient
    // for the original function's arity, execute it immediately.
    if (args.length >= arity) {
      return fn(...args);
    } else {
      // Otherwise, return a new function that expects the remaining arguments,
      // accumulating the currently provided ones.
      return (...moreArgs: any[]) => curried(...args, ...moreArgs);
    }
  }

  return curried as Curried<Args<T>, Return<T>>;
}