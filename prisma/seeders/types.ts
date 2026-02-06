export const SEED_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type SeederEnvironment = (typeof SEED_ENVIRONMENTS)[number];