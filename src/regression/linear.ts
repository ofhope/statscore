import { curry } from "../fp";
import { DEFAULT_OPTIONS } from "./const";
import type { DataPoint, PredictedPoint, RegressionOptions, RegressionResult } from "./types";
import { rSquared, round } from "./util";

/**
 * Performs simple linear regression to model the relationship between a dependent variable (y) and an independent variable (x).
 * This algorithm fits a straight line through the data points that minimizes the sum of squared residuals between the observed and predicted y values.
 *
 * @param {Partial<RegressionOptions>} [suppliedOptions] - Optional regression options to override defaults, such as `precision`.
 * @param {DataPoint[]} data - An array of data points, where each `DataPoint` is a tuple `[x, y]`.
 * Expects at least two non-null data points to perform the regression.
 * @returns {RegressionResult} A discriminant union representing the success or failure of the regression.
 * - If successful (`ok: true`), it returns the `points` on the regression line, a `predict` function,
 * the `equation` (gradient and intercept), the `r2` (coefficient of determination), and a `string` representation of the equation.
 * - If unsuccessful (`ok: false`), it provides an `errorType` (e.g., "InsufficientData", "DegenerateInput") and a `message`.
 *
 * @example
 * // Basic usage
 * const data = [[1, 2], [2, 3], [3, 4], [4, 5]];
 * const result = linear({}, data);
 * if (result.ok) {
 * console.log(`Regression Equation: ${result.string}`); // "y = 1x + 1"
 * console.log(`R-squared: ${result.r2}`); // ~1
 * console.log(`Predicted Y for X=5: ${result.predict(5)[1]}`); // 6
 * } else {
 * console.error(`Error: ${result.message}`);
 * }
 *
 * @example
 * // Using custom precision
 * const data = [[1, 2], [2, 3], [3, 4], [4, 5]];
 * const result = linear({ precision: 4 }, data);
 *
 * @example
 * // Handling insufficient data
 * const data = [[1, 2]];
 * const result = linear({}, data);
 * // result.ok will be false, result.errorType will be "InsufficientData"
 *
 * @example
 * // Handling vertical line (degenerate input)
 * const data = [[1, 2], [1, 3], [1, 4]];
 * const result = linear({}, data);
 * // result.ok will be false, result.errorType will be "DegenerateInput"
 *
 * @description
 * **Insights derived from Linear Regression:**
 * - **Trend Identification:** Reveals the linear trend between two variables. A positive gradient indicates a positive correlation, a negative gradient indicates a negative correlation.
 * - **Magnitude of Relationship:** The gradient (`m`) quantifies how much the dependent variable (y) changes for every unit increase in the independent variable (x).
 * - **Prediction:** Allows for prediction of the dependent variable's value for a given independent variable's value.
 * - **Goodness of Fit:** The R-squared (`r2`) value indicates how well the regression line fits the observed data, ranging from 0 (no fit) to 1 (perfect fit). [cite_start]A high R-squared suggests the model explains a large proportion of the variance in the dependent variable. [cite: 48]
 */
function _linear(suppliedOptions: Partial<RegressionOptions>, data: DataPoint[]): RegressionResult {
  const options: RegressionOptions = {
    ...DEFAULT_OPTIONS,
    ...suppliedOptions,
  };

  const filteredData = data.filter(d => d[1] !== null) as [number, number][];

  if (filteredData.length < 2) {
    return {
      ok: false,
      errorType: "InsufficientData",
      message: `Linear regression requires at least 2 valid data points (x, y). Received ${filteredData.length}.`,
    };
  }

  const sum = [0, 0, 0, 0, 0]; // sx, sy, sx2, sxy, sy2
  const len = filteredData.length;

  for (let n = 0; n < len; n++) {
    sum[0] += filteredData[n][0]; // sum x
    sum[1] += filteredData[n][1]; // sum y
    sum[2] += filteredData[n][0] * filteredData[n][0]; // sum x^2
    sum[3] += filteredData[n][0] * filteredData[n][1]; // sum xy
    sum[4] += filteredData[n][1] * filteredData[n][1]; // sum y^2
  }

  const run = ((len * sum[2]) - (sum[0] * sum[0]));
  const rise = ((len * sum[3]) - (sum[0] * sum[1]));

  if (run === 0) {
    // This implies all x values are the same, leading to a vertical line, which linear regression cannot model.
    // Or it means len * sum[2] === sum[0] * sum[0], which for non-zero sum[0] implies all x values are the same.
    return {
      ok: false,
      errorType: "DegenerateInput",
      message: "Cannot perform linear regression: all x-values are identical, resulting in a vertical line.",
    };
  }

  const gradient = round(rise / run, options.precision);
  const intercept = round((sum[1] / len) - ((gradient * sum[0]) / len), options.precision);

  const predict = (x: number): PredictedPoint => ([
    round(x, options.precision),
    round((gradient * x) + intercept, options.precision)
  ]);

  const points = data.map(point => predict(point[0])); // Use original data length for points array

  return {
    ok: true,
    points,
    predict,
    equation: [gradient, intercept],
    r2: round(rSquared(data, points), options.precision),
    string: intercept === 0 ? `y = ${gradient}x` : `y = ${gradient}x + ${intercept}`,
  };
}

export const linear = curry(_linear);