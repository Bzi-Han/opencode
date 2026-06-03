import path from "path"
import fs from "fs"
import { PromptLoader } from "@opencode-ai/core/prompts"
import { Effect, Layer } from "effect"

const PROMPTS_DIR = path.resolve(import.meta.dir, "..", "prompts")

let cache: Map<string, string> | null = null

function ensureCache(): Map<string, string> {
  if (cache) return cache
  cache = new Map<string, string>()

  const scanDir = (dir: string, prefix: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath, `${prefix}${entry.name}/`)
      } else if (entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".md"))) {
        const name = entry.name.replace(/\.(txt|md)$/, "")
        const id = `${prefix}${name}`
        cache!.set(id, fs.readFileSync(fullPath, "utf-8"))
      }
    }
  }

  scanDir(PROMPTS_DIR, "")
  return cache
}

export function getSync(id: string): string {
  const content = ensureCache().get(id)
  if (content === undefined) throw new Error(`Prompt not found: ${id}`)
  return content
}

export function renderSync(id: string, vars: Record<string, string>): string {
  const template = ensureCache().get(id)
  if (template === undefined) throw new Error(`Prompt not found: ${id}`)
  return template.replace(/\$\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key]
    if (value === undefined) throw new Error(`Missing prompt variable: ${key}`)
    return value
  })
}

export const layer = Layer.effect(
  PromptLoader.Service,
  Effect.sync(() => {
    ensureCache()
    return PromptLoader.Service.of({
      get: (id: string) =>
        Effect.sync(() => {
          const content = ensureCache().get(id)
          if (content === undefined) throw new Error(`Prompt not found: ${id}`)
          return content
        }),
      render: (id: string, vars: Record<string, string>) =>
        Effect.sync(() => renderSync(id, vars)),
    })
  }),
)

export const defaultLayer = layer

export * as PromptLoaderImpl from "./prompt-loader"
