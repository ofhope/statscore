/**
 * Common interface for the successful output of all regression methods.
 */
export interface RegressionSuccess {
  ok: true;
  /**
   * The slope (gradient) of the fitted linear regression line.
   * Represents the change in the dependent variable (Y) for a one-unit change in the independent variable (X).
   */
  m: number;
  /**
   * The Y-intercept of the fitted linear regression line.
   * Represents the expected value of the dependent variable (Y) when the independent variable (X) is zero.
   */
  b: number;
  /**
   * The R-squared value, a statistical measure that represents the proportion of the variance
   * for a dependent variable that's explained by an independent variable or variables in a regression model.
   * Values range from 0 to 1, with higher values indicating a better fit.
   */
  rSquared?: number;
  /**
   * The method used for the statistical calculation, providing context for interpretation.
   */
  method: "linear" | "logarithmic" | "exponential" | "power" | "polynomial";
  /**
   * An array of [x, y] points representing the fitted regression line,
   * generated from the input data points based on the calculated equation.
   * Useful for directly plotting the regression line on a chart.
   */
  points: PredictedPoint[];
  /**
   * A function that takes an x-value and returns its predicted y-value
   * based on the calculated linear regression equation (y = mx + b).
   */
  predict: (x: number) => PredictedPoint;
}

/**
 * Interface for the error output of regression methods.
 */
export interface RegressionError {
  ok: false;
  errorType:
    | "InsufficientData"
    | "DegenerateInput"
    | "MathError"
    | "InvalidInput"
    | "NumericalStability";
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
export type DataPoint = [number, number];

/**
 * Options interface for regression methods.
 */
export interface RegressionOptions {
  /**
   * The precision for rounding numerical results.
   */
  precision: number;
}
