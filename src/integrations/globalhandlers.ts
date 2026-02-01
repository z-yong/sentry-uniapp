import { defineIntegration, captureException, captureMessage, getCurrentScope } from '@sentry/core';
import type { Integration, IntegrationFn } from '@sentry/core';
import { logger } from '@sentry/core';

import { sdk } from '../crossPlatform';

const INTEGRATION_NAME = 'GlobalHandlers';

interface GlobalHandlersOptions {
  onerror?: boolean;
  onunhandledrejection?: boolean;
  onpagenotfound?: boolean;
  onmemorywarning?: boolean;
}

const _globalHandlersIntegration = ((options: GlobalHandlersOptions = {}) => {
  const _options = {
    onerror: true,
    onunhandledrejection: true,
    onpagenotfound: true,
    onmemorywarning: true,
    ...options,
  };

  let _onErrorHandlerInstalled = false;
  let _onUnhandledRejectionHandlerInstalled = false;
  let _onPageNotFoundHandlerInstalled = false;
  let _onMemoryWarningHandlerInstalled = false;

  return {
    name: INTEGRATION_NAME,
    setup() {
      if (_options.onerror) {
        _installGlobalOnErrorHandler();
      }
      if (_options.onunhandledrejection) {
        _installGlobalOnUnhandledRejectionHandler();
      }
      if (_options.onpagenotfound) {
        _installGlobalOnPageNotFoundHandler();
      }
      if (_options.onmemorywarning) {
        _installGlobalOnMemoryWarningHandler();
      }
    },
  } satisfies Integration;

  function _installGlobalOnErrorHandler(): void {
    if (_onErrorHandlerInstalled || !sdk.onError) {
      return;
    }

    sdk.onError((err: string | object) => {
      const error = typeof err === 'string' ? new Error(err) : err;
      captureException(error, {
        mechanism: {
          type: 'onerror',
          handled: false,
        },
      });
    });

    _onErrorHandlerInstalled = true;
    logger.log('Global Handler attached: onError');
  }

  function _installGlobalOnUnhandledRejectionHandler(): void {
    if (_onUnhandledRejectionHandlerInstalled || !sdk.onUnhandledRejection) {
      return;
    }

    sdk.onUnhandledRejection((res: { reason: string | object; promise: Promise<any> }) => {
      const error = typeof res.reason === 'string' ? new Error(res.reason) : res.reason;
      captureException(error, {
        mechanism: {
          type: 'onunhandledrejection',
          handled: false,
        },
        data: { promise: res.promise },
      });
    });

    _onUnhandledRejectionHandlerInstalled = true;
    logger.log('Global Handler attached: onUnhandledRejection');
  }

  function _installGlobalOnPageNotFoundHandler(): void {
    if (_onPageNotFoundHandlerInstalled || !sdk.onPageNotFound) {
      return;
    }

    sdk.onPageNotFound((res: { path: string }) => {
      const scope = getCurrentScope();
      const url = res.path.split('?')[0];

      scope.setTag('pagenotfound', url);
      scope.setContext('pagenotfound', res);

      captureMessage(`Page not found: ${url}`, {
        level: 'warning',
      });
    });

    _onPageNotFoundHandlerInstalled = true;
    logger.log('Global Handler attached: onPageNotFound');
  }

  function _installGlobalOnMemoryWarningHandler(): void {
    if (_onMemoryWarningHandlerInstalled || !sdk.onMemoryWarning) {
      return;
    }

    sdk.onMemoryWarning(({ level = -1 }: { level: number }) => {
      let levelMessage = 'Unknown memory warning level';

      switch (level) {
        case 5:
          levelMessage = 'TRIM_MEMORY_RUNNING_MODERATE';
          break;
        case 10:
          levelMessage = 'TRIM_MEMORY_RUNNING_LOW';
          break;
        case 15:
          levelMessage = 'TRIM_MEMORY_RUNNING_CRITICAL';
          break;
        default:
          return;
      }

      const scope = getCurrentScope();
      scope.setTag('memory-warning', String(level));
      scope.setContext('memory-warning', { level, levelMessage });

      captureMessage('Memory warning', {
        level: 'warning',
      });
    });

    _onMemoryWarningHandlerInstalled = true;
    logger.log('Global Handler attached: onMemoryWarning');
  }
}) satisfies IntegrationFn;

/**
 * Global handlers integration - captures unhandled errors and rejections
 */
export const globalHandlersIntegration = defineIntegration(_globalHandlersIntegration);
