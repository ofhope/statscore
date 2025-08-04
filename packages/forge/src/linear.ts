import { curry } from '@facta/fp';
import type { RegressionResult, RegressionSuccess, RegressionError } from '@facta/stats'; // Assuming path

/**
 * @typedef LinearInsightGenerationOptions
 * @property {number} [rSquaredThresholdWeak=0.3] - R-squared value below which correlation is considered weak.
 * @property {number} [rSquaredThresholdStrong=0.7] - R-squared value above which correlation is considered strong.
 * @property {number} [pValueSignificanceLevel=0.05] - Alpha level for statistical significance.
 * @property {number} [outlierZScoreThreshold=3] - Z-score threshold for identifying outliers in residuals.
 */
interface LinearInsightGenerationOptions {
    rSquaredThresholdWeak?: number;
    rSquaredThresholdStrong?: number;
    pValueSignificanceLevel?: number;
    outlierZScoreThreshold?: number;
}

/**
 * @typedef GeneratedInsight
 * @property {string} summary - A concise natural language summary of the insight.
 * @property {string} type - A programmatic type for the insight (e.g., 'TrendDescription', 'CorrelationStrength', 'OutlierWarning').
 * @property {any} [data] - Optional, structured data related to the insight (e.g., indices of outliers, specific values).
 * @property {string[]} [chartAnnotations] - Optional, an array of instructions or data for visual annotations.
 */
export type GeneratedInsight = {
    summary: string;
    type: string;
    data?: any;
    annotations?: string[]; // Example: ["drawTrendLine", "highlightOutlier: [5, 10]"]
};

/**
 * @typedef InsightResultSuccess
 * @property {true} ok - Indicates successful insight generation.
 * @property {GeneratedInsight[]} insights - An array of generated insights.
 */
export type InsightResultSuccess = {
    ok: true;
    insights: GeneratedInsight[];
};

/**
 * @typedef InsightResultError
 * @property {false} ok - Indicates an error during insight generation.
 * @property {string} message - A user-friendly error message.
 * @property {string} helpText - Suggestions for the user to resolve the issue.
 * @property {string} originalErrorType - The errorType from @facta/stats for debugging.
 */
export type InsightResultError = {
    ok: false;
    message: string;
    helpText: string;
    originalErrorType: string; // Maps to errorType from @facta/stats
};

export type LinearInsightsOutput = InsightResultSuccess | InsightResultError;

/**
 * @function regressionSummary
 * @description Generates a natural language summary of the linear regression trend.
 * @param {LinearInsightGenerationOptions} options - Configuration options for insight generation.
 * @param {RegressionSuccess} result - The successful result from @facta/stats linear regression.
 * @returns {GeneratedInsight} A descriptive insight about the trend.
 */
const regressionSummary = (result: RegressionSuccess): GeneratedInsight => {
    const { m, b } = result;
    let summary = '';
    let chartAnnotations: string[] = [`drawTrendLine:${m},${b}`];

    if (m > 0) {
        summary = `There is a positive linear trend. As X increases, Y tends to increase.`;
    } else if (m < 0) {
        summary = `There is a negative linear trend. As X increases, Y tends to decrease.`;
    } else {
        summary = `There is no significant linear trend. Y remains relatively constant as X changes.`;
    }

    // Add more detail based on p-values if available

    return {
        summary,
        type: 'TrendDescription',
        data: { m, b },
        annotations: chartAnnotations
    };
};

/**
 * @function generateCorrelationStrengthInsight
 * @description Generates an insight regarding the strength of the linear correlation based on R-squared.
 * @param {LinearInsightGenerationOptions} options - Configuration options for insight generation.
 * @param {LinearRegressionSuccessResult} result - The successful result from @facta/stats linear regression.
 * @returns {GeneratedInsight} An insight about correlation strength.
 */
const correlationStrength = curry((options: LinearInsightGenerationOptions, result: RegressionSuccess): GeneratedInsight => {
    const { rSquared } = result;
    const rSqWeak = options.rSquaredThresholdWeak ?? 0.3;
    const rSqStrong = options.rSquaredThresholdStrong ?? 0.7;

    let summary = '';
    if (rSquared >= rSqStrong) {
        summary = `There is a strong linear correlation (R-squared: ${rSquared.toFixed(2)}), indicating the model explains a large portion of the variance.`;
    } else if (rSquared >= rSqWeak) {
        summary = `There is a moderate linear correlation (R-squared: ${rSquared.toFixed(2)}).`;
    } else {
        summary = `There is a weak linear correlation (R-squared: ${rSquared.toFixed(2)}), suggesting the linear model may not be the best fit or other factors are at play.`;
    }

    return {
        summary,
        type: 'CorrelationStrength',
        data: { rSquared }
    };
});

/**
 * @function regressionError
 * @description Translates a technical @facta/stats error into a user-friendly insight error.
 * @param {LinearRegressionErrorResult} errorResult - The error result from @facta/stats linear regression.
 * @returns {InsightResultError} A user-friendly error object.
 */
export const regressionError = (errorResult: RegressionError): InsightResultError => {
    switch (errorResult.errorType) {
        case "InsufficientData":
            return {
                ok: false,
                message: "Unable to calculate trend: Not enough data points.",
                helpText: "Linear regression requires at least two distinct data points. Please provide more data.",
                originalErrorType: errorResult.errorType
            };
        case "InvalidInput":
            return {
                ok: false,
                message: "Invalid data provided.",
                helpText: "Ensure your data only contains valid numerical values (e.g., no 'null', 'undefined', or non-numeric strings).",
                originalErrorType: errorResult.errorType
            };
        default:
            return {
                ok: false,
                message: "An unexpected error occurred during linear regression calculation.",
                helpText: "Please contact support with the details of the data you were trying to analyze.",
                originalErrorType: errorResult.errorType
            };
    }
};


/**
 * @function linearRegressionInsights
 * @description Orchestrates the generation of various insights from a linear regression result.
 * This function acts as the primary entry point for linear regression insight generation in @facta/forge.
 * @param {LinearInsightGenerationOptions} options - Configuration options for the insights.
 * @param {LinearRegressionResult} statsResult - The raw result from @facta/stats.linear.
 * @returns {LinearInsightsOutput} A discriminant union containing either an array of insights or a user-friendly error.
 */
export function linearRegressionInsights(
    options: LinearInsightGenerationOptions,
    statsResult: RegressionResult
): LinearInsightsOutput {
    if (!statsResult.ok) {
        return regressionError(statsResult);
    }

    const insights: GeneratedInsight[] = [];

    insights.push(regressionSummary(statsResult));

    const getCorrelationStrength = correlationStrength(options);
    insights.push(getCorrelationStrength(statsResult));

    return {
        ok: true,
        insights
    };
}