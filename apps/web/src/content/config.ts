import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const scoringFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["number", "select", "boolean", "text"]),
  min: z.number().optional(),
  max: z.number().optional(),
  weight: z.number().default(1)
});

const frameworks = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/frameworks" }),
  schema: z.object({
    name: z.string(),
    version: z.string(),
    formula: z.string(),
    fields: z.array(scoringFieldSchema)
  })
});

const configCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/config" }),
  schema: z
    .object({
      integrations: z
        .object({
          calendar: z
            .object({
              enabled: z.boolean().default(true),
              entity_id: z.string().min(1),
              default_duration_minutes: z.number().int().positive().default(30),
              timezone: z.string().min(1).default("UTC")
            })
            .optional(),
          grocy: z.object({ enabled: z.boolean() }).optional(),
          node_red: z.object({ enabled: z.boolean() }).optional(),
          n8n: z.object({ enabled: z.boolean() }).optional()
        })
        .optional()
    })
    .passthrough()
});

export const collections = {
  frameworks,
  config: configCollection
};
