interface WebMCPToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMCPToolExecutionOptions {
  signal: AbortSignal;
}

interface WebMCPTool<TInput = Record<string, unknown>, TResult = unknown> {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (
    input: TInput,
    options: WebMCPToolExecutionOptions,
  ) => TResult | Promise<TResult>;
}

interface WebMCPRegisterOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

interface ModelContext {
  registerTool<TInput = Record<string, unknown>, TResult = unknown>(
    tool: WebMCPTool<TInput, TResult>,
    options?: WebMCPRegisterOptions,
  ): Promise<void>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
