import type { BaseTransportOptions, Transport, TransportMakeRequestResponse, TransportRequest } from '@sentry/core';
import { createTransport, rejectedSyncPromise } from '@sentry/core';

import { sdk } from './crossPlatform';

/**
 * Creates a Transport that uses UniApp's request API
 */
export function makeUniappTransport(
    options: BaseTransportOptions
): Transport {
    function makeRequest(request: TransportRequest): PromiseLike<TransportMakeRequestResponse> {
        const requestFunc = sdk.request || sdk.httpRequest;

        if (!requestFunc) {
            return rejectedSyncPromise(new Error('No request function available'));
        }

        return new Promise<TransportMakeRequestResponse>((resolve, reject) => {
            requestFunc({
                url: options.url,
                method: 'POST',
                data: request.body,
                header: {
                    'Content-Type': 'application/x-sentry-envelope',
                },
                success(res: { statusCode: number; header?: Record<string, string> }) {
                    const status = res.statusCode;
                    const headers = res.header || {};

                    resolve({
                        statusCode: status,
                        headers: {
                            'x-sentry-rate-limits': headers['x-sentry-rate-limits'] || headers['X-Sentry-Rate-Limits'] || null,
                            'retry-after': headers['retry-after'] || headers['Retry-After'] || null,
                        },
                    });
                },
                fail(error: any) {
                    reject(error);
                },
            });
        });
    }

    return createTransport(options, makeRequest);
}

// Export as XHRTransport for backward compatibility
export const XHRTransport = makeUniappTransport;
