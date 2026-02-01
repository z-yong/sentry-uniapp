import { defineIntegration } from "@sentry/core";
import type { Client, Event, Integration, IntegrationFn } from "@sentry/core";

import { appName, sdk } from "../crossPlatform";

const INTEGRATION_NAME = 'IgnoreMpcrawlerErrors';

/**
 * IgnoreMpcrawlerErrors
 *
 * https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/sitemap.html
 */
const _ignoreMpcrawlerErrorsIntegration = (() => {
    return {
        name: INTEGRATION_NAME,
        setupOnce() {
            // Setup is now handled via processEvent
        },
        processEvent(event: Event, _hint: unknown, _client: Client): Event | null {
            if (
                appName === "wechat" &&
                sdk.getLaunchOptionsSync
            ) {
                try {
                    const options = sdk.getLaunchOptionsSync();

                    if (options.scene === 1129) {
                        // Ignore miniprogram crawler errors
                        return null;
                    }
                } catch (e) {
                    // If we can't get launch options, just continue
                }
            }

            return event;
        },
    } satisfies Integration;
}) satisfies IntegrationFn;

/**
 * IgnoreMpcrawlerErrors integration - filters out WeChat miniprogram crawler errors
 */
export const ignoreMpcrawlerErrorsIntegration = defineIntegration(_ignoreMpcrawlerErrorsIntegration);
