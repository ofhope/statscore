
/**
 * Common interface for the successful output of all regression methods.
 */
export interface RegressionSuccess {
  ok: true;
  points: PredictedPoint[];
  predict: (x: number) => PredictedPoint;
  equation: number[];
  r2: number;
  string: string;
}

/**
 * Interface for the error output of regression methods.
 */
export interface RegressionError {
  ok: false;
  errorType: "InsufficientData" | "DegenerateInput" | "MathError" | "InvalidInput" | "NumericalStability";
  message: string;
}

/**
 * Discriminant union type for the result of regression methods,
 * indicating either a successful computation or a detailed error.
 */
export type RegressionResult = RegressionSuccess | RegressionError;

/**
 * Represents a predicted data point with an x and predicted y value.
 */
export type PredictedPoint = [number, number];

/**
 * Represents a data point with an x and y value.
 */
export type DataPoint = [number, number | null];

/**
 * Options interface for regression methods.
 */
export interface RegressionOptions {
  order: number;
  precision: number;
  period: number | null; // Added for potential future use in time series, etc.
}
