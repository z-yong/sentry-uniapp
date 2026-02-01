import type { Event, EventHint, Exception, SeverityLevel, StackFrame } from '@sentry/core';
import { addExceptionMechanism, addExceptionTypeValue, extractExceptionKeysForMessage, normalizeToSize } from '@sentry/core';

import { exceptionFromStacktrace } from './parsers';
import { computeStackTrace } from './tracekit';

/**
 * Builds an Event from an Exception
 */
export function eventFromException(exception: unknown, hint?: EventHint): Event {
  const syntheticException = (hint && (hint as any).syntheticException) || undefined;
  const event = eventFromUnknownInput(exception, syntheticException, {
    attachStacktrace: (hint as any)?.attachStacktrace,
  });

  addExceptionMechanism(event, {
    handled: true,
    type: 'generic',
  });

  event.level = 'error';

  if (hint && hint.event_id) {
    event.event_id = hint.event_id;
  }

  return event;
}

/**
 * Builds an Event from a Message
 */
export function eventFromMessage(
  message: string,
  level: SeverityLevel = 'info',
  hint?: EventHint
): Event {
  const syntheticException = (hint && (hint as any).syntheticException) || undefined;
  const event = eventFromString(message, syntheticException, {
    attachStacktrace: (hint as any)?.attachStacktrace,
  });

  event.level = level;

  if (hint && hint.event_id) {
    event.event_id = hint.event_id;
  }

  return event;
}

/**
 * Builds an Event from an unknown input
 */
function eventFromUnknownInput(
  exception: unknown,
  syntheticException?: Error,
  options: { attachStacktrace?: boolean } = {}
): Event {
  let event: Event;

  // Check if it's an ErrorEvent
  if (typeof exception === 'object' && exception !== null && 'error' in exception) {
    const errorEvent = exception as any;
    if (errorEvent.error) {
      exception = errorEvent.error;
    }
  }

  // Check if it's an Error
  if (exception instanceof Error) {
    event = eventFromStacktrace(exception);
    return event;
  }

  // Check if it's a plain  object
  if (typeof exception === 'object' && exception !== null) {
    const objectException = exception as Record<string, unknown>;
    event = eventFromPlainObject(objectException, syntheticException);
    addExceptionMechanism(event, {
      synthetic: true,
    });
    return event;
  }

  // For everything else, treat as string
  event = eventFromString(String(exception), syntheticException, options);
  addExceptionTypeValue(event, String(exception), undefined);
  addExceptionMechanism(event, {
    synthetic: true,
  });

  return event;
}

/**
 * Create event from string
 */
function eventFromString(
  input: string,
  syntheticException?: Error,
  options: { attachStacktrace?: boolean } = {}
): Event {
  const event: Event = {
    message: input,
  };

  if (options.attachStacktrace && syntheticException) {
    const stacktrace = computeStackTrace(syntheticException);
    const frames = prepareFramesForEvent(stacktrace.stack);
    event.exception = {
      values: [
        {
          value: input,
          stacktrace: frames.length ? { frames: frames.reverse() } : undefined,
        },
      ],
    };
  }

  return event;
}

/**
 * Create event from stacktrace
 */
function eventFromStacktrace(exception: Error): Event {
  const stacktrace = computeStackTrace(exception);
  const exceptionData = exceptionFromStacktrace(stacktrace);

  const event: Event = {
    exception: {
      values: [exceptionData],
    },
  };

  return event;
}

/**
 * Create event from plain object
 */
function eventFromPlainObject(
  exception: Record<string, unknown>,
  syntheticException?: Error
): Event {
  const message = `Non-Error exception captured with keys: ${extractExceptionKeysForMessage(exception)}`;

  const event: Event = {
    exception: {
      values: [
        {
          type: 'Error',
          value: message,
        },
      ],
    },
    extra: {
      __serialized__: normalizeToSize(exception),
    },
  };

  if (syntheticException) {
    const stacktrace = computeStackTrace(syntheticException);
    const frames = prepareFramesForEvent(stacktrace.stack);
    if (event.exception?.values?.[0]) {
      event.exception.values[0].stacktrace = frames.length
        ? { frames: frames.reverse() }
        : undefined;
    }
  }

  return event;
}

/**
 * Prepare frames for event
 */
function prepareFramesForEvent(stack: any[]): StackFrame[] {
  if (!stack || !stack.length) {
    return [];
  }

  return stack.map((frame: any) => ({
    filename: frame.url,
    function: frame.func || '?',
    lineno: frame.line,
    colno: frame.column,
  }));
}
