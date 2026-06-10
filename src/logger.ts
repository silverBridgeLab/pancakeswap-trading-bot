export interface Logger {
  trace(message?: unknown, ...optionalParams: unknown[]): void;
  debug(message?: unknown, ...optionalParams: unknown[]): void;
  info(message?: unknown, ...optionalParams: unknown[]): void;
  warn(message?: unknown, ...optionalParams: unknown[]): void;
  error(message?: unknown, ...optionalParams: unknown[]): void;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

function format(prefix: string, level: string, message?: unknown, args: unknown[] = []): string {
  const base = `${prefix} ${level}`;
  if (message === undefined) return base;
  return `${base} ${[formatValue(message), ...args.map(formatValue)].join(' ')}`;
}

export function createAppLogger(scope: string, verbose: boolean): Logger {
  const prefix = `[${scope}]`;
  return {
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
}
