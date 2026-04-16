export const CACHE_DEFAULT_TTL_SECONDS = 300;
export const CACHE_MAX_SIZE = 1000;
export const CACHE_EXPIRY_CHECK_PERIOD_MIN_SECONDS = 60;
export const CACHE_EXPIRY_CHECK_PERIOD_DIVISOR = 5;

export const CACHE_SKILL_TTL_SECONDS = {
	"synth-": 1800,
	"req-": 900,
	"arch-": 1800,
	"debug-": 60,
	"eval-": 300,
	"adapt-": 120,
	"qual-": 3600,
	"doc-": 1800,
	"qm-": 600,
	"gr-": 600,
	"gov-": 180,
} as const satisfies Record<string, number>;

export const DEFAULT_CACHE_CONFIG_VALUES = {
	maxSize: CACHE_MAX_SIZE,
	defaultTtl: CACHE_DEFAULT_TTL_SECONDS,
	enableLru: true,
	enableStats: true,
	skillTtlMap: { ...CACHE_SKILL_TTL_SECONDS },
};

export const PLANNING_GATE_MAX_TIME_MS = 5000;
export const PLANNING_GATE_FALLBACK_LATENCY_MS = 5000;

export const PLANNING_GATE_STRICT_AVAILABILITY_PREFIXES = [
	"gov-",
	"eval-",
	"debug-",
];

export const PLANNING_GATE_ADVISORY_ONLY_PREFIXES = ["qm-", "gr-", "doc-"];

export const DEFAULT_PLANNING_GATE_CONFIG_VALUES = {
	enabled: true,
	advisoryFallback: true,
	maxPlanningTime: PLANNING_GATE_MAX_TIME_MS,
	strictAvailabilityCheck: [...PLANNING_GATE_STRICT_AVAILABILITY_PREFIXES],
	advisoryOnlySkills: [...PLANNING_GATE_ADVISORY_ONLY_PREFIXES],
};

export const DEFAULT_ORCHESTRATION_RETRY_CONFIG = {
	attempts: 3,
	backoffMs: 1000,
	maxBackoffMs: 10000,
};

export const DEFAULT_ORCHESTRATION_RUNTIME_CONFIG_VALUES = {
	maxConcurrency: 5,
	maxQueueSize: 100,
	defaultTimeout: 30000,
	enablePriority: true,
	enableCaching: true,
	enablePlanning: true,
	retry: { ...DEFAULT_ORCHESTRATION_RETRY_CONFIG },
};

export const DEFAULT_INTEGRATED_RUNTIME_CONFIG_VALUES = {
	orchestration: {
		maxConcurrency: 3,
		enableCaching: true,
		enablePlanning: true,
	},
	caching: {
		maxSize: 500,
		defaultTtl: CACHE_DEFAULT_TTL_SECONDS,
		enableLru: true,
	},
	planning: {
		enabled: true,
		advisoryFallback: true,
	},
	validation: {
		strict: false,
		sanitize: true,
		allowPhysicsSkills: false,
	},
	enableOrchestration: true,
	fallbackToDirectExecution: true,
};

export const DEFAULT_RETRY_OPTIONS = {
	retries: 3,
	minTimeout: 500,
	maxTimeout: 5000,
	factor: 2,
	randomize: true,
};

export const NETWORK_RETRY_OPTIONS = {
	retries: 3,
	minTimeout: 300,
	maxTimeout: 3000,
	factor: 2,
	randomize: true,
};

export const SKILL_RETRY_OPTIONS = {
	retries: 5,
	minTimeout: 200,
	maxTimeout: 2000,
	factor: 1.5,
	randomize: true,
};

export const SESSION_COMPRESSION_THRESHOLD_BYTES = 1024;

export const DEFAULT_SESSION_INTEGRITY_OPTIONS_VALUES = {
	enableMac: true,
	enableCompression: true,
	compressionThreshold: SESSION_COMPRESSION_THRESHOLD_BYTES,
};

export const WORKFLOW_MONITOR_POLL_INTERVAL_MS = 100;

export const DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES = {
	observability: {
		logLevel: "info",
		enableMetrics: true,
		enableTracing: true,
	},
	graphOrchestration: {
		optimizationStrategy: "aco",
		pruningThreshold: 0.1,
	},
	stateMachine: {
		enableWorkflowPersistence: true,
		defaultTimeout: 30000,
	},
	analytics: {
		metricsRetentionDays: 30,
		anomalyDetectionSensitivity: 1.5,
	},
} as const satisfies {
	observability: {
		logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
		enableMetrics: boolean;
		enableTracing: boolean;
	};
	graphOrchestration: {
		optimizationStrategy: "aco" | "physarum" | "hebbian";
		pruningThreshold: number;
	};
	stateMachine: {
		enableWorkflowPersistence: boolean;
		defaultTimeout: number;
	};
	analytics: {
		metricsRetentionDays: number;
		anomalyDetectionSensitivity: number;
	};
};

export const STATISTICAL_ANALYSIS_THRESHOLDS = {
	trendStableSlope: 0.1,
	trendConfidence: 0.8,
	anomalyMinSampleSize: 10,
	anomalyDefaultSensitivity: 2,
	anomalyHighZScore: 3,
	anomalyMediumZScore: 2.5,
	effectSizeSignificant: 0.8,
	performanceMinSampleSize: 5,
	reliabilityScaleMax: 100,
	efficiencyCeiling: 200,
	reliabilityWeight: 0.4,
	efficiencyWeight: 0.4,
	consistencyWeight: 0.2,
	excellentScore: 85,
	goodScore: 70,
	averageScore: 50,
	correlationMinSampleSize: 10,
	correlationAlignedMinSize: 5,
	correlationStrong: 0.7,
	correlationModerate: 0.3,
	correlationWeak: 0.1,
	alignmentWindowMs: 60000,
};
