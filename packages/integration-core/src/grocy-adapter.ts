/**
 * Grocy Stock Adapter — Bidirectional
 *
 * Follows the CalendarIntegrationAdapter pattern from integration-core.
 * Supports both read (checkStock) and write (addToShoppingList, consumeItems)
 * to establish the adapter pattern for Obsidian + Calendar integrations later.
 *
 * Key flow: "Add item to shopping list → generate Go to Store task"
 */

// --- Types ---

export interface GrocyAdapterConfig {
  baseUrl: string
  apiKey: string
  timeoutMs?: number | undefined
}

export interface GrocyStockItem {
  productId: number
  name: string
  amount: number
  bestBeforeDate: string | null
}

export interface GrocyShoppingListItem {
  id?: number | undefined
  productId: number
  amount: number
  note?: string | undefined
  shoppingListId?: number | undefined
}

export interface GrocyConsumeRequest {
  productId: number
  amount: number
  transactionType?: "consume" | "spoiled" | undefined
}

export type GrocyErrorCode =
  | "timeout"
  | "unauthorized"
  | "invalid_request"
  | "service_unavailable"
  | "unknown"

export type GrocyResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: GrocyErrorCode; retryable: boolean; message: string }

// --- Error Classification (matches HA adapter pattern) ---

function classifyGrocyError(
  status: number
): Pick<Extract<GrocyResult<never>, { ok: false }>, "errorCode" | "retryable"> {
  if (status === 401 || status === 403) {
    return { errorCode: "unauthorized", retryable: false }
  }
  if (status === 400 || status === 422) {
    return { errorCode: "invalid_request", retryable: false }
  }
  if (status === 429) {
    return { errorCode: "service_unavailable", retryable: true }
  }
  if (status >= 500) {
    return { errorCode: "service_unavailable", retryable: true }
  }
  return { errorCode: "unknown", retryable: true }
}

// --- Adapter ---

export class GrocyStockAdapter {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeoutMs: number

  constructor(config: GrocyAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
    this.apiKey = config.apiKey
    this.timeoutMs = config.timeoutMs ?? 8_000
  }

  /**
   * Check stock levels for given product names.
   * GET /api/stock — returns all stock items, filtered by names.
   */
  async checkStock(productNames: string[]): Promise<GrocyResult<GrocyStockItem[]>> {
    return this.request<GrocyStockItem[]>("GET", "/api/stock", undefined, (raw) => {
      const items = Array.isArray(raw) ? raw : []
      const lowerNames = productNames.map((n) => n.toLowerCase())
      return items
        .filter((item: Record<string, unknown>) => {
          const product = item.product as Record<string, unknown> | undefined
          const name = typeof product?.name === "string" ? product.name.toLowerCase() : ""
          return lowerNames.some((ln) => name.includes(ln))
        })
        .map((item: Record<string, unknown>) => ({
          productId: item.product_id as number,
          name: (item.product as Record<string, unknown>)?.name as string,
          amount: item.amount as number,
          bestBeforeDate: (item.best_before_date as string) ?? null,
        }))
    })
  }

  /**
   * Add items to Grocy shopping list.
   * POST /api/stock/shoppinglist/add-product — one per item.
   * Key flow: triggers "Go to Store" task creation in Meitheal.
   */
  async addToShoppingList(
    items: GrocyShoppingListItem[]
  ): Promise<GrocyResult<{ added: number }>> {
    let added = 0
    for (const item of items) {
      const result = await this.request("POST", "/api/stock/shoppinglist/add-product", {
        product_id: item.productId,
        amount: item.amount,
        note: item.note ?? "",
        list_id: item.shoppingListId ?? 1,
      })
      if (!result.ok) return result as GrocyResult<{ added: number }>
      added++
    }
    return { ok: true, data: { added } }
  }

  /**
   * Consume stock items.
   * POST /api/stock/products/{id}/consume — one per item.
   */
  async consumeItems(items: GrocyConsumeRequest[]): Promise<GrocyResult<{ consumed: number }>> {
    let consumed = 0
    for (const item of items) {
      const result = await this.request(
        "POST",
        `/api/stock/products/${item.productId}/consume`,
        {
          amount: item.amount,
          transaction_type: item.transactionType ?? "consume",
        }
      )
      if (!result.ok) return result as GrocyResult<{ consumed: number }>
      consumed++
    }
    return { ok: true, data: { consumed } }
  }

  /**
   * Get current shopping list contents.
   * GET /api/objects/shopping_list
   */
  async getShoppingList(
    listId?: number
  ): Promise<GrocyResult<GrocyShoppingListItem[]>> {
    return this.request<GrocyShoppingListItem[]>(
      "GET",
      "/api/objects/shopping_list",
      undefined,
      (raw) => {
        const items = Array.isArray(raw) ? raw : []
        return items
          .filter((item: Record<string, unknown>) =>
            listId ? item.shopping_list_id === listId : true
          )
          .map((item: Record<string, unknown>) => ({
            id: item.id as number,
            productId: item.product_id as number,
            amount: item.amount as number,
            note: (item.note as string) ?? undefined,
            shoppingListId: item.shopping_list_id as number,
          }))
      }
    )
  }

  // --- Internal HTTP helper ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    transform?: (raw: unknown) => T
  ): Promise<GrocyResult<T>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          "GROCY-API-KEY": this.apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })

      if (!response.ok) {
        const classification = classifyGrocyError(response.status)
        return {
          ok: false,
          ...classification,
          message: `Grocy ${method} ${path}: HTTP ${response.status}`,
        }
      }

      const rawText = await response.text()
      let raw: unknown = undefined
      if (rawText) {
        try {
          raw = JSON.parse(rawText)
        } catch {
          raw = rawText
        }
      }

      const data = transform ? transform(raw) : (raw as T)
      return { ok: true, data }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          errorCode: "timeout",
          retryable: true,
          message: `Grocy ${method} ${path}: timeout after ${this.timeoutMs}ms`,
        }
      }

      return {
        ok: false,
        errorCode: "unknown",
        retryable: true,
        message: error instanceof Error ? error.message : "Unknown Grocy adapter error",
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
