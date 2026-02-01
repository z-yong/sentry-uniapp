// Type exports
// Type exports
export type {
  Breadcrumb,
  BreadcrumbHint,
  Request,
  SdkInfo,
  Event,
  EventHint,
  Exception,
  SeverityLevel,
  StackFrame,
  Stacktrace,
  Thread,
  User,
  Session,
} from '@sentry/core';

// Core SDK exports
export {
  addBreadcrumb,
  addEventProcessor,
  captureCheckIn,
  captureException,
  captureEvent,
  captureFeedback,
  captureMessage,
  close,
  continueTrace,
  createTransport,
  flush,
  getClient,
  getCurrentScope,
  getGlobalScope,
  getIsolationScope,
  isInitialized,
  lastEventId,
  metrics,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
  startSession,
  endSession,
  startSpan,
  startInactiveSpan,
  startSpanManual,
  withScope,
  withIsolationScope,
  captureConsoleIntegration,
  debugIntegration,
  dedupeIntegration,
  extraErrorDataIntegration,
  functionToStringIntegration,
  inboundFiltersIntegration,
  linkedErrorsIntegration,
  moduleMetadataIntegration,
  requestDataIntegration,
  rewriteFramesIntegration,
  sessionTimingIntegration,
  zodErrorsIntegration,
} from '@sentry/core';

// SDK-specific exports
export { init, showReportDialog } from './sdk';
export { UniappClient } from './client';
export type { UniappOptions, ReportDialogOptions } from './client';
export { makeUniappTransport } from './transport';

// Integrations
export {
  globalHandlersIntegration,
  systemIntegration,
  routerIntegration,
} from './integrations';

// Version
export { SDK_NAME, SDK_VERSION } from './version';

// Re-export integrations namespace for compatibility
import * as Integrations from './integrations';
export { Integrations };
