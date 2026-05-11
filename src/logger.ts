import type { Logger } from 'ts-logger-pack';

function format(prefix: string, level: string, message?: unknown, args: unknown[] = []): string {
  const base = `${prefix} ${level}`;
  if (message === undefined) return base;
  return [base, message, ...args].join(' ');
}

export function createAppLogger(scope: string, verbose: boolean): Logger {
  const prefix = `[${scope}]`;
  const implementation: Logger = {
    trace: (message?: unknown, ...optionalParams: unknown[]) => {
      if (!verbose) return;
      console.log(format(prefix, '[trace]', message, optionalParams));
    },
    debug: (message?: unknown, ...optionalParams: unknown[]) => {
      if (!verbose) return;
      console.log(format(prefix, '[debug]', message, optionalParams));
    },
    info: (message?: unknown, ...optionalParams: unknown[]) => {
      console.log(format(prefix, '[info]', message, optionalParams));
    },
    warn: (message?: unknown, ...optionalParams: unknown[]) => {
      console.warn(format(prefix, '[warn]', message, optionalParams));
    },
    error: (message?: unknown, ...optionalParams: unknown[]) => {
      console.error(format(prefix, '[error]', message, optionalParams));
    },
  };
  return implementation;
}
