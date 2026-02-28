import { expect, test } from "@playwright/test"
import { GrocyStockAdapter } from "../../packages/integration-core/src/grocy-adapter"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"

// --- Mock Grocy API server ---

function createMockGrocyServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void
): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer(handler)
    server.listen(0, () => {
      const addr = server.address()
      const port = typeof addr === "object" && addr ? addr.port : 0
      resolve({
        port,
        close: () => new Promise<void>((r) => server.close(() => r())),
      })
    })
  })
}

test.describe("Grocy Stock Adapter", () => {
  test("checkStock returns matching items", async () => {
    const mock = await createMockGrocyServer((req, res) => {
      if (req.url === "/api/stock") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(
          JSON.stringify([
            { product_id: 1, product: { name: "Milk" }, amount: 2, best_before_date: "2026-03-15" },
            { product_id: 2, product: { name: "Bread" }, amount: 1, best_before_date: null },
            { product_id: 3, product: { name: "Butter" }, amount: 0, best_before_date: null },
          ])
        )
      }
    })

    try {
      const adapter = new GrocyStockAdapter({
        baseUrl: `http://127.0.0.1:${mock.port}`,
        apiKey: "test-key",
      })

      const result = await adapter.checkStock(["milk", "butter"])
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0]!.name).toBe("Milk")
        expect(result.data[1]!.name).toBe("Butter")
      }
    } finally {
      await mock.close()
    }
  })

  test("addToShoppingList sends correct API calls", async () => {
    const calls: string[] = []
    const mock = await createMockGrocyServer((req, res) => {
      let body = ""
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString()
      })
      req.on("end", () => {
        calls.push(`${req.method} ${req.url} ${body}`)
        res.writeHead(200, { "content-type": "application/json" })
        res.end("{}")
      })
    })

    try {
      const adapter = new GrocyStockAdapter({
        baseUrl: `http://127.0.0.1:${mock.port}`,
        apiKey: "test-key",
      })

      const result = await adapter.addToShoppingList([
        { productId: 1, amount: 2, note: "Low on milk" },
      ])

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.added).toBe(1)
      }
      expect(calls).toHaveLength(1)
      expect(calls[0]).toContain("POST /api/stock/shoppinglist/add-product")
    } finally {
      await mock.close()
    }
  })

  test("handles HTTP error gracefully", async () => {
    const mock = await createMockGrocyServer((_req, res) => {
      res.writeHead(401)
      res.end("Unauthorized")
    })

    try {
      const adapter = new GrocyStockAdapter({
        baseUrl: `http://127.0.0.1:${mock.port}`,
        apiKey: "bad-key",
      })

      const result = await adapter.checkStock(["milk"])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errorCode).toBe("unauthorized")
        expect(result.retryable).toBe(false)
      }
    } finally {
      await mock.close()
    }
  })

  test("handles timeout", async () => {
    const mock = await createMockGrocyServer((_req, _res) => {
      // Never respond — causes timeout
    })

    try {
      const adapter = new GrocyStockAdapter({
        baseUrl: `http://127.0.0.1:${mock.port}`,
        apiKey: "test-key",
        timeoutMs: 500,
      })

      const result = await adapter.checkStock(["milk"])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errorCode).toBe("timeout")
        expect(result.retryable).toBe(true)
      }
    } finally {
      await mock.close()
    }
  })

  test("handles 5xx as retryable", async () => {
    const mock = await createMockGrocyServer((_req, res) => {
      res.writeHead(503)
      res.end("Service Unavailable")
    })

    try {
      const adapter = new GrocyStockAdapter({
        baseUrl: `http://127.0.0.1:${mock.port}`,
        apiKey: "test-key",
      })

      const result = await adapter.checkStock(["bread"])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errorCode).toBe("service_unavailable")
        expect(result.retryable).toBe(true)
      }
    } finally {
      await mock.close()
    }
  })
})
