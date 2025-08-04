import { describe, it, expect} from "vitest";
import { linearRegressionInsights, regressionError } from "./linear";
import type { RegressionSuccess, RegressionError } from '@facta/stats';

// Mock data generators for testing
const createMockRegressionSuccess = (overrides: Partial<RegressionSuccess> = {}): RegressionSuccess => ({
    ok: true,
    m: 2.5,
    b: 10,
    rSquared: 0.85,
    method: "linear",
    points: [[1, 12.5], [2, 15], [3, 17.5], [4, 20]],
    predict: (x: number) => [x, 2.5 * x + 10],
    pValueM: 0.01,
    seM: 0.2,
    tM: 12.5,
    df: 2,
    ...overrides
});

const createMockRegressionError = (errorType: RegressionError['errorType'], message: string = "Error"): RegressionError => ({
    ok: false,
    errorType,
    message
});

describe("linearRegressionInsights", () => {
    const defaultOptions = {
        rSquaredThresholdWeak: 0.3,
        rSquaredThresholdStrong: 0.7,
        pValueSignificanceLevel: 0.05,
        outlierZScoreThreshold: 3
    };

    describe("linearRegression function", () => {
        it("should generate insights for a successful positive trend", () => {
            const mockSuccess = createMockRegressionSuccess({
                m: 2.5,
                b: 10,
                rSquared: 0.85
            });

            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            expect(result.insights).toHaveLength(2);
            
            // Check trend description insight
            const trendInsight = result.insights.find(insight => insight.type === 'TrendDescription');
            expect(trendInsight).toBeDefined();
            expect(trendInsight!.summary).toContain('positive linear trend');
            expect(trendInsight!.data).toEqual({ m: 2.5, b: 10 });
            expect(trendInsight!.annotations).toEqual(['drawTrendLine:2.5,10']);

            // Check correlation strength insight
            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight).toBeDefined();
            expect(correlationInsight!.summary).toContain('strong linear correlation');
            expect(correlationInsight!.summary).toContain('0.85');
            expect(correlationInsight!.data).toEqual({ rSquared: 0.85 });
        });

        it("should generate insights for a negative trend", () => {
            const mockSuccess = createMockRegressionSuccess({
                m: -1.5,
                b: 20,
                rSquared: 0.65
            });

            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
                const trendInsight = result.insights.find(insight => insight.type === 'TrendDescription');
                expect(trendInsight!.summary).toContain('negative linear trend');
                expect(trendInsight!.summary).toContain('Y tends to decrease');
                expect(trendInsight!.annotations).toEqual(['drawTrendLine:-1.5,20']);
        });

        it("should generate insights for no trend (slope = 0)", () => {
            const mockSuccess = createMockRegressionSuccess({
                m: 0,
                b: 15,
                rSquared: 0.05
            });

            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const trendInsight = result.insights.find(insight => insight.type === 'TrendDescription');
            expect(trendInsight!.summary).toContain('no significant linear trend');
            expect(trendInsight!.summary).toContain('Y remains relatively constant');
            });

        it("should classify correlation strength correctly - strong", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.8 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('strong linear correlation');
        });

        it("should classify correlation strength correctly - moderate", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.5 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('moderate linear correlation');
        });

        it("should classify correlation strength correctly - weak", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.1 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('weak linear correlation');
            expect(correlationInsight!.summary).toContain('may not be the best fit');
        });

        it("should use custom thresholds for correlation strength", () => {
            const customOptions = {
                ...defaultOptions,
                rSquaredThresholdWeak: 0.5,
                rSquaredThresholdStrong: 0.9
            };

            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.6 });
            const result = linearRegressionInsights(customOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('moderate linear correlation');
        });

        it("should handle regression errors properly", () => {
            const mockError = createMockRegressionError("InsufficientData", "Not enough data points");
            const result = linearRegressionInsights(defaultOptions, mockError);

            if (result.ok) {
                throw new Error("Expected result to be an error");
            }
            
            expect(result.message).toContain("Not enough data points");
            expect(result.helpText).toContain("at least two distinct data points");
            expect(result.originalErrorType).toBe("InsufficientData");
        });
    });

    describe("regressionError", () => {
        it("should handle InsufficientData error", () => {
            const error = createMockRegressionError("InsufficientData");
            const result = regressionError(error);

            expect(result.ok).toBe(false);
            expect(result.message).toContain("Not enough data points");
            expect(result.helpText).toContain("at least two distinct data points");
            expect(result.originalErrorType).toBe("InsufficientData");
        });

        it("should handle InvalidInput error", () => {
            const error = createMockRegressionError("InvalidInput");
            const result = regressionError(error);

            expect(result.ok).toBe(false);
            expect(result.message).toContain("Invalid data provided");
            expect(result.helpText).toContain("valid numerical values");
            expect(result.originalErrorType).toBe("InvalidInput");
        });

        it("should handle unknown error types", () => {
            const error = createMockRegressionError("MathError");
            const result = regressionError(error);

            expect(result.ok).toBe(false);
            expect(result.message).toContain("unexpected error occurred");
            expect(result.helpText).toContain("contact support");
            expect(result.originalErrorType).toBe("MathError");
        });

        it("should handle DegenerateInput error", () => {
            const error = createMockRegressionError("DegenerateInput");
            const result = regressionError(error);

            expect(result.ok).toBe(false);
            expect(result.message).toContain("unexpected error occurred");
            expect(result.originalErrorType).toBe("DegenerateInput");
        });

        it("should handle NumericalStability error", () => {
            const error = createMockRegressionError("NumericalStability");
            const result = regressionError(error);

            expect(result.ok).toBe(false);
            expect(result.message).toContain("unexpected error occurred");
            expect(result.originalErrorType).toBe("NumericalStability");
        });
    });

    describe("Edge cases and boundary conditions", () => {
        it("should handle R-squared exactly at threshold boundaries", () => {
            // Test exact weak threshold
            let mockSuccess = createMockRegressionSuccess({ rSquared: 0.3 });
            let result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight1 = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight1!.summary).toContain('moderate');

            // Test exact strong threshold
            mockSuccess = createMockRegressionSuccess({ rSquared: 0.7 });
            result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const correlationInsight2 = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight2!.summary).toContain('strong');
        });

        it("should handle very small slope values", () => {
            const mockSuccess = createMockRegressionSuccess({ m: 0.0001 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const trendInsight = result.insights.find(insight => insight.type === 'TrendDescription');
            expect(trendInsight!.summary).toContain('positive linear trend');
        });

        it("should handle very large slope values", () => {
            const mockSuccess = createMockRegressionSuccess({ m: 1000000 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }

            const trendInsight = result.insights.find(insight => insight.type === 'TrendDescription');
            expect(trendInsight!.summary).toContain('positive linear trend');
            expect(trendInsight!.annotations).toEqual(['drawTrendLine:1000000,10']);
        });

        it("should handle perfect correlation (R-squared = 1)", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 1.0 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('strong linear correlation');
            expect(correlationInsight!.summary).toContain('1.00');
        });

        it("should handle no correlation (R-squared = 0)", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.0 });
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('weak linear correlation');
            expect(correlationInsight!.summary).toContain('0.00');
        
        });
    });

    describe("Options handling", () => {
        it("should use default options when not provided", () => {
            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.5 });
            const result = linearRegressionInsights({}, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('moderate linear correlation');
        });

        it("should handle partial options", () => {
            const partialOptions = {
                rSquaredThresholdWeak: 0.4
                // Other options should use defaults
            };

            const mockSuccess = createMockRegressionSuccess({ rSquared: 0.35 });
            const result = linearRegressionInsights(partialOptions, mockSuccess);

            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
            const correlationInsight = result.insights.find(insight => insight.type === 'CorrelationStrength');
            expect(correlationInsight!.summary).toContain('weak linear correlation');
        });
    });

    describe("Type safety and structure", () => {
        it("should return correct structure for success case", () => {
            const mockSuccess = createMockRegressionSuccess();
            const result = linearRegressionInsights(defaultOptions, mockSuccess);

            expect(result).toHaveProperty('ok');
            
            if (!result.ok) {
                throw new Error("Expected result to be ok");
            }
            
            expect(result).toHaveProperty('insights');
            expect(Array.isArray(result.insights)).toBe(true);
            
            result.insights.forEach(insight => {
                expect(insight).toHaveProperty('summary');
                expect(insight).toHaveProperty('type');
                expect(typeof insight.summary).toBe('string');
                expect(typeof insight.type).toBe('string');
            });
        });

        it("should return correct structure for error case", () => {
            const mockError = createMockRegressionError("InvalidInput");
            const result = linearRegressionInsights(defaultOptions, mockError);

            expect(result).toHaveProperty('ok');
            
            if (result.ok) {
                throw new Error("Expected result to be an error");
            }
            
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('helpText');
            expect(result).toHaveProperty('originalErrorType');
            expect(typeof result.message).toBe('string');
            expect(typeof result.helpText).toBe('string');
        });
    });
})