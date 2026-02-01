import {
  inboundFiltersIntegration,
  functionToStringIntegration,
  linkedErrorsIntegration,
  dedupeIntegration,
  getClient,
  getCurrentScope,
} from '@sentry/core';
import { createStackParser, nodeStackLineParser } from '@sentry/core';
import type { Integration, StackParser } from '@sentry/core';

import { UniappClient, UniappOptions, ReportDialogOptions } from './client';
import { makeUniappTransport } from './transport';
import {
  globalHandlersIntegration,
  systemIntegration,
  routerIntegration,
} from './integrations';

/** Get the default integrations for the Uniapp SDK. */
function getDefaultIntegrations(options: UniappOptions): Integration[] {
  const integrations = [
    inboundFiltersIntegration(),
    functionToStringIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
    globalHandlersIntegration(options.extraOptions),
    systemIntegration(),
    routerIntegration(),
  ];

  return integrations;
}

/**
 * Initialize the Sentry Uniapp SDK.
 */
export function init(options: Partial<UniappOptions> = {}): void {
  const finalOptions: UniappOptions = {
    stackParser: createStackParser(nodeStackLineParser()),
    transport: makeUniappTransport,
    integrations: [],
    ...options,
  };

  // Set default integrations if not provided
  if (!options.integrations) {
    finalOptions.integrations = getDefaultIntegrations(finalOptions);
  }

  const client = new UniappClient(finalOptions);
  const scope = getCurrentScope();

  scope.setClient(client);
  client.init();
}

/**
 * Present the user with a report dialog.
 * Not supported in miniapp environment - this is a no-op.
 */
export function showReportDialog(options: ReportDialogOptions = {}): void {
  // Not supported in miniapp environment
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('sentry-uniapp: showReportDialog is not supported in miniapp environment');
  }
}

/**
 * Get the last event ID captured.
 */
export function lastEventId(): string | undefined {
  const scope = getCurrentScope();
  return scope.lastEventId();
}

/**
 * Flush all pending events.
 */
export async function flush(timeout?: number): Promise<boolean> {
  const client = getClient<UniappClient>();
  if (client) {
    return client.flush(timeout);
  }
  return Promise.resolve(false);
}

/**
 * Close the SDK and flush all pending events.
 */
export async function close(timeout?: number): Promise<boolean> {
  const client = getClient<UniappClient>();
  if (client) {
    return client.close(timeout);
  }
  return Promise.resolve(false);
}
