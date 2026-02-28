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
  schema: z.record(z.unknown())
});

export const collections = {
  frameworks,
  config: configCollection
};
