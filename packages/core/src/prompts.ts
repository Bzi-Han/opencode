import { Context, Effect } from "effect"

export interface Interface {
  readonly get: (id: string) => Effect.Effect<string>
  readonly render: (id: string, vars: Record<string, string>) => Effect.Effect<string>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/PromptLoader") {}

export * as PromptLoader from "./prompts"
