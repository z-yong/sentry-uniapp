import { defineIntegration, getClient } from '@sentry/core';
import type { Client, Event, Integration, IntegrationFn } from '@sentry/core';

import { appName as currentAppName, sdk } from '../crossPlatform';

const INTEGRATION_NAME = 'System';

interface SystemInfo {
  batteryLevel?: number;
  currentBattery?: number;
  battery?: number;
  brand?: string;
  language?: string;
  model?: string;
  pixelRatio?: number;
  platform?: string;
  screenHeight?: number;
  screenWidth?: number;
  statusBarHeight?: number;
  system?: string;
  version?: string;
  windowHeight?: number;
  windowWidth?: number;
  app?: string;
  appName?: string;
  fontSizeSetting?: number;
  [key: string]: any;
}

const _systemIntegration = (() => {
  return {
    name: INTEGRATION_NAME,
    setupOnce() {
      // No setup needed
    },
    processEvent(event: Event, _hint: unknown, _client: Client): Event {
      try {
        const systemInfo: SystemInfo = sdk.getSystemInfoSync();

        const {
          batteryLevel,
          currentBattery,
          battery,
          brand,
          language,
          model,
          pixelRatio,
          platform,
          screenHeight,
          screenWidth,
          statusBarHeight,
          system,
          version,
          windowHeight,
          windowWidth,
          app,
          appName,
          fontSizeSetting,
        } = systemInfo;

        const [systemName, systemVersion] = (system || '').split(' ');

        return {
          ...event,
          contexts: {
            ...event.contexts,
            device: {
              ...event.contexts?.device,
              brand,
              battery_level: batteryLevel || currentBattery || battery,
              model,
              screen_dpi: pixelRatio,
            },
            os: {
              ...event.contexts?.os,
              name: systemName || system,
              version: systemVersion || system,
            },
            app: {
              ...event.contexts?.app,
              app_name: app || appName || currentAppName,
            },
          },
          extra: {
            ...event.extra,
            systemInfo: {
              language,
              platform,
              screenHeight,
              screenWidth,
              statusBarHeight,
              version,
              windowHeight,
              windowWidth,
              fontSizeSetting,
            },
          },
        };
      } catch (e) {
        // Silently fail if system info is not available
      }

      return event;
    },
  } satisfies Integration;
}) satisfies IntegrationFn;

/**
 * System integration - collects system information from the miniapp environment
 */
export const systemIntegration = defineIntegration(_systemIntegration);
