/**
 * Request Deduplication
 * Prevents duplicate API calls for the same resource
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map()
  private readonly ttl: number = 5000 // 5 seconds

  /**
   * Deduplicate a request by key
   * If a request with the same key is already pending, return that promise
   * Otherwise, execute the request function
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a pending request for this key
    const existing = this.pendingRequests.get(key)

    if (existing) {
      const age = Date.now() - existing.timestamp

      // If request is still fresh, return it
      if (age < this.ttl) {
        return existing.promise
      } else {
        // Request is stale, remove it
        this.pendingRequests.delete(key)
      }
    }

    // Create new request
    const promise = requestFn()

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    // Clean up when request completes
    promise
      .then(() => this.cleanup(key))
      .catch(() => this.cleanup(key))

    return promise
  }

  /**
   * Clean up a completed request
   */
  private cleanup(key: string): void {
    setTimeout(() => {
      this.pendingRequests.delete(key)
    }, 100)
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

// Global singleton
export const requestDeduplicator = new RequestDeduplicator()

/**
 * Deduplicate fetch requests
 */
export async function deduplicatedFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = `${options?.method || 'GET'}:${url}`

  return requestDeduplicator.deduplicate(key, async () => {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  })
}
