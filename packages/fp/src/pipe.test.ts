import { describe, it, expect } from "vitest";
import { pipe } from './pipe';

describe('pipe', () => {
  // Helper functions for testing
  const add1 = (x: number) => x + 1;
  const multiply2 = (x: number) => x * 2;
  const toString = (x: number) => x.toString();
  const toUpperCase = (x: string) => x.toUpperCase();
  const split = (x: string) => x.split('');
  const length = (x: any[]) => x.length;

  describe('single function composition', () => {
    it('should work with a single function', () => {
      const pipeline = pipe(add1);
      expect(pipeline(5)).toBe(6);
    });

    it('should preserve function behavior with single function', () => {
      const pipeline = pipe(toString);
      expect(pipeline(42)).toBe('42');
    });
  });

  describe('two function composition', () => {
    it('should compose two functions correctly', () => {
      const pipeline = pipe(add1, multiply2);
      expect(pipeline(5)).toBe(12); // (5 + 1) * 2 = 12
    });

    it('should work with different types', () => {
      const pipeline = pipe(multiply2, toString);
      expect(pipeline(5)).toBe('10');
    });
  });

  describe('three function composition', () => {
    it('should compose three functions correctly', () => {
      const pipeline = pipe(add1, multiply2, toString);
      expect(pipeline(5)).toBe('12'); // (5 + 1) * 2 = 12, then '12'
    });

    it('should handle type transformations', () => {
      const pipeline = pipe(toString, toUpperCase, split);
      expect(pipeline(42)).toEqual(['4', '2']);
    });
  });

  describe('longer composition chains', () => {
    it('should handle 4 functions', () => {
      const pipeline = pipe(add1, multiply2, toString, toUpperCase);
      expect(pipeline(5)).toBe('12');
    });

    it('should handle 5 functions', () => {
      const pipeline = pipe(add1, multiply2, toString, split, length);
      expect(pipeline(5)).toBe(2); // (5+1)*2 = 12, '12', ['1','2'], length = 2
    });

    it('should handle 7+ functions (fallback overload)', () => {
      const pipeline = pipe(
        add1,           // 6
        multiply2,      // 12
        add1,           // 13
        multiply2,      // 26
        add1,           // 27
        multiply2,      // 54
        toString,       // '54'
        split,          // ['5', '4']
        length          // 2
      );
      expect(pipeline(5)).toBe(2);
    });
  });

  describe('statistical data transformation pipeline', () => {
    const data = [1, 2, 3, 4, 5];
    
    const addOne = (arr: number[]) => arr.map(x => x + 1);
    const multiplyByTwo = (arr: number[]) => arr.map(x => x * 2);
    const sum = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);

    it('should process array data through multiple transformations', () => {
      const processData = pipe(addOne, multiplyByTwo, sum);
      expect(processData(data)).toBe(40); // [2,3,4,5,6] -> [4,6,8,10,12] -> 40
    });

    it('should work with statistical operations', () => {
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const normalize = (arr: number[]) => {
        const m = mean(arr);
        return arr.map(x => x - m);
      };
      const variance = (arr: number[]) => {
        const m = mean(arr);
        return arr.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / arr.length;
      };

      const pipeline = pipe(normalize, variance);
      const result = pipeline([1, 2, 3, 4, 5]);
      expect(result).toBeCloseTo(2, 5); // Variance of normalized data
    });
  });

  describe('complex type transformations', () => {
    interface User {
      name: string;
      age: number;
    }

    const users: User[] = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
      { name: 'Charlie', age: 35 }
    ];

    it('should handle object transformations', () => {
      const getNames = (users: User[]) => users.map(u => u.name);
      const joinNames = (names: string[]) => names.join(', ');
      const addPrefix = (str: string) => `Users: ${str}`;

      const pipeline = pipe(getNames, joinNames, addPrefix);
      expect(pipeline(users)).toBe('Users: Alice, Bob, Charlie');
    });

    it('should handle filtering and aggregation', () => {
      const filterAdults = (users: User[]) => users.filter(u => u.age >= 30);
      const getAges = (users: User[]) => users.map(u => u.age);
      const average = (ages: number[]) => ages.reduce((a, b) => a + b, 0) / ages.length;

      const pipeline = pipe(filterAdults, getAges, average);
      expect(pipeline(users)).toBe(32.5); // (30 + 35) / 2
    });
  });

  describe('edge cases', () => {
    it('should work with identity function', () => {
      const identity = <T>(x: T) => x;
      const pipeline = pipe(identity);
      expect(pipeline(42)).toBe(42);
      expect(pipeline('hello')).toBe('hello');
    });

    it('should handle functions that return different types', () => {
      const numberToString = (x: number) => x.toString();
      const stringToArray = (x: string) => x.split('');
      const arrayToBoolean = (x: any[]) => x.length > 0;

      const pipeline = pipe(numberToString, stringToArray, arrayToBoolean);
      expect(pipeline(0)).toBe(true); // '0' -> ['0'] -> true
      expect(pipeline(123)).toBe(true); // '123' -> ['1','2','3'] -> true
    });

    it('should work with async-like patterns (though sync)', () => {
      const asyncLike1 = (x: number) => Promise.resolve(x * 2);
      const asyncLike2 = (p: Promise<number>) => p.then(x => x + 1);
      
      // Note: This tests the type system, actual async would need different handling
      const pipeline = pipe(asyncLike1, asyncLike2);
      const result = pipeline(5);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('error handling', () => {
    it('should propagate errors through the pipeline', () => {
      const throwError = (x: number) => {
        if (x < 0) throw new Error('Negative number');
        return x * 2;
      };
      const add10 = (x: number) => x + 10;

      const pipeline = pipe(throwError, add10);
      
      expect(() => pipeline(-1)).toThrow('Negative number');
      expect(pipeline(5)).toBe(20); // 5 * 2 + 10
    });

    it('should handle null/undefined values if functions support them', () => {
      const handleNull = (x: number | null) => x === null ? 0 : x;
      const double = (x: number) => x * 2;

      const pipeline = pipe(handleNull, double);
      expect(pipeline(null)).toBe(0);
      expect(pipeline(5)).toBe(10);
    });
  });

  describe('performance and behavior', () => {
    it('should execute functions in the correct order', () => {
      const operations: string[] = [];
      
      const op1 = (x: number) => { operations.push('op1'); return x + 1; };
      const op2 = (x: number) => { operations.push('op2'); return x * 2; };
      const op3 = (x: number) => { operations.push('op3'); return x - 1; };

      const pipeline = pipe(op1, op2, op3);
      pipeline(5);

      expect(operations).toEqual(['op1', 'op2', 'op3']);
    });

    it('should be reusable', () => {
      const pipeline = pipe(add1, multiply2);
      
      expect(pipeline(1)).toBe(4); // (1+1)*2
      expect(pipeline(2)).toBe(6); // (2+1)*2
      expect(pipeline(3)).toBe(8); // (3+1)*2
    });

    it('should work with large datasets', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      
      const doubleAll = (arr: number[]) => arr.map(x => x * 2);
      const sumAll = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      
      const pipeline = pipe(doubleAll, sumAll);
      const result = pipeline(largeArray);
      
      // Sum of 0 to 9999, then doubled: 2 * (9999 * 10000 / 2) = 99990000
      expect(result).toBe(99990000);
    });
  });

  describe('type safety validation', () => {
    it('should maintain type information through composition', () => {
      // This test validates that TypeScript compilation succeeds with proper types
      const numberPipeline = pipe(
        (x: number) => x + 1,
        (x: number) => x * 2,
        (x: number) => x.toString()
      );
      
      const result: string = numberPipeline(5);
      expect(typeof result).toBe('string');
      expect(result).toBe('12');
    });

    it('should work with generic functions', () => {
      const identity = <T>(x: T): T => x;
      const wrap = <T>(x: T): T[] => [x];
      
      const pipeline = pipe(identity, wrap);
      expect(pipeline(42)).toEqual([42]);
      expect(pipeline('hello')).toEqual(['hello']);
    });
  });
});
