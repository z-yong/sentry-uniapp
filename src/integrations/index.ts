export { globalHandlersIntegration } from './globalhandlers';
export { routerIntegration } from './router';
export { systemIntegration } from './system';

// Re-export integrations from @sentry/core for convenience
export {
    inboundFiltersIntegration,
    functionToStringIntegration,
    linkedErrorsIntegration,
    dedupeIntegration,
} from '@sentry/core';
