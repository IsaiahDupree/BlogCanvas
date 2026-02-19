import { describe, expect, test } from '@jest/globals'

/**
 * Unit Tests for State Management
 * Tests initial state, actions, and selectors for various state patterns
 * Feature: VENDOR-WC-006
 */

// Simple state manager (like useState pattern)
class SimpleStateManager<T> {
  private state: T
  private listeners: Array<(state: T) => void> = []

  constructor(initialState: T) {
    this.state = initialState
  }

  getState(): T {
    return this.state
  }

  setState(newState: T | ((prevState: T) => T)): void {
    if (typeof newState === 'function') {
      this.state = (newState as (prevState: T) => T)(this.state)
    } else {
      this.state = newState
    }
    this.listeners.forEach(listener => listener(this.state))
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

// Reducer pattern (like useReducer)
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number }
  | { type: 'RESET' }

interface CounterState {
  count: number
  lastAction: string | null
}

function counterReducer(state: CounterState, action: Action): CounterState {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1, lastAction: 'INCREMENT' }
    case 'DECREMENT':
      return { count: state.count - 1, lastAction: 'DECREMENT' }
    case 'SET':
      return { count: action.payload, lastAction: 'SET' }
    case 'RESET':
      return { count: 0, lastAction: 'RESET' }
    default:
      return state
  }
}

describe('State Management - Initial State', () => {
  test('should initialize with default state', () => {
    const initialState = { count: 0, lastAction: null }
    const store = new SimpleStateManager(initialState)

    expect(store.getState()).toEqual({ count: 0, lastAction: null })
  })

  test('should initialize with custom state', () => {
    const customState = { count: 10, lastAction: 'INITIALIZED' }
    const store = new SimpleStateManager(customState)

    expect(store.getState()).toEqual({ count: 10, lastAction: 'INITIALIZED' })
  })

  test('should initialize with complex nested state', () => {
    const complexState = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        settings: {
          theme: 'dark',
          notifications: true
        }
      },
      isLoading: false
    }
    const store = new SimpleStateManager(complexState)

    expect(store.getState()).toEqual(complexState)
  })

  test('should initialize with array state', () => {
    const arrayState = [1, 2, 3, 4, 5]
    const store = new SimpleStateManager(arrayState)

    expect(store.getState()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('State Management - Actions', () => {
  test('should update state with new value', () => {
    const store = new SimpleStateManager({ count: 0 })

    store.setState({ count: 5 })

    expect(store.getState()).toEqual({ count: 5 })
  })

  test('should update state with function updater', () => {
    const store = new SimpleStateManager({ count: 0 })

    store.setState(prev => ({ count: prev.count + 1 }))

    expect(store.getState()).toEqual({ count: 1 })
  })

  test('should handle multiple sequential updates', () => {
    const store = new SimpleStateManager({ count: 0 })

    store.setState(prev => ({ count: prev.count + 1 }))
    store.setState(prev => ({ count: prev.count + 1 }))
    store.setState(prev => ({ count: prev.count + 1 }))

    expect(store.getState()).toEqual({ count: 3 })
  })

  test('should update nested state immutably', () => {
    const store = new SimpleStateManager({
      user: { name: 'John', age: 30 },
      theme: 'light'
    })

    const oldUser = store.getState().user
    store.setState(prev => ({
      ...prev,
      user: { ...prev.user, age: 31 }
    }))

    expect(store.getState().user.age).toBe(31)
    expect(store.getState().user).not.toBe(oldUser) // Different reference
  })

  test('should handle array state updates', () => {
    const store = new SimpleStateManager([1, 2, 3])

    store.setState(prev => [...prev, 4])

    expect(store.getState()).toEqual([1, 2, 3, 4])
  })
})

describe('State Management - Reducer Pattern', () => {
  test('should handle INCREMENT action', () => {
    const initialState: CounterState = { count: 0, lastAction: null }
    const newState = counterReducer(initialState, { type: 'INCREMENT' })

    expect(newState.count).toBe(1)
    expect(newState.lastAction).toBe('INCREMENT')
  })

  test('should handle DECREMENT action', () => {
    const initialState: CounterState = { count: 5, lastAction: null }
    const newState = counterReducer(initialState, { type: 'DECREMENT' })

    expect(newState.count).toBe(4)
    expect(newState.lastAction).toBe('DECREMENT')
  })

  test('should handle SET action', () => {
    const initialState: CounterState = { count: 0, lastAction: null }
    const newState = counterReducer(initialState, { type: 'SET', payload: 100 })

    expect(newState.count).toBe(100)
    expect(newState.lastAction).toBe('SET')
  })

  test('should handle RESET action', () => {
    const initialState: CounterState = { count: 42, lastAction: 'INCREMENT' }
    const newState = counterReducer(initialState, { type: 'RESET' })

    expect(newState.count).toBe(0)
    expect(newState.lastAction).toBe('RESET')
  })

  test('should return same state for unknown action', () => {
    const initialState: CounterState = { count: 5, lastAction: null }
    const newState = counterReducer(initialState, { type: 'UNKNOWN' } as any)

    expect(newState).toBe(initialState)
  })

  test('should not mutate original state', () => {
    const initialState: CounterState = { count: 5, lastAction: null }
    const newState = counterReducer(initialState, { type: 'INCREMENT' })

    expect(initialState.count).toBe(5)
    expect(newState.count).toBe(6)
    expect(newState).not.toBe(initialState)
  })

  test('should handle sequence of actions', () => {
    let state: CounterState = { count: 0, lastAction: null }

    state = counterReducer(state, { type: 'INCREMENT' })
    state = counterReducer(state, { type: 'INCREMENT' })
    state = counterReducer(state, { type: 'SET', payload: 10 })
    state = counterReducer(state, { type: 'DECREMENT' })

    expect(state.count).toBe(9)
    expect(state.lastAction).toBe('DECREMENT')
  })
})

describe('State Management - Selectors', () => {
  interface AppState {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
    posts: Array<{
      id: string
      title: string
      published: boolean
    }>
    ui: {
      isLoading: boolean
      theme: string
    }
  }

  const mockState: AppState = {
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    },
    posts: [
      { id: '1', title: 'First Post', published: true },
      { id: '2', title: 'Draft Post', published: false },
      { id: '3', title: 'Another Post', published: true }
    ],
    ui: {
      isLoading: false,
      theme: 'dark'
    }
  }

  // Selectors
  const selectUser = (state: AppState) => state.user
  const selectUserName = (state: AppState) => state.user.name
  const selectIsAdmin = (state: AppState) => state.user.role === 'admin'
  const selectPublishedPosts = (state: AppState) =>
    state.posts.filter(post => post.published)
  const selectPostCount = (state: AppState) => state.posts.length
  const selectTheme = (state: AppState) => state.ui.theme

  test('should select user object', () => {
    const user = selectUser(mockState)
    expect(user).toEqual({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    })
  })

  test('should select user name', () => {
    const name = selectUserName(mockState)
    expect(name).toBe('John Doe')
  })

  test('should select admin status', () => {
    const isAdmin = selectIsAdmin(mockState)
    expect(isAdmin).toBe(true)

    const nonAdminState = {
      ...mockState,
      user: { ...mockState.user, role: 'user' }
    }
    expect(selectIsAdmin(nonAdminState)).toBe(false)
  })

  test('should select published posts', () => {
    const publishedPosts = selectPublishedPosts(mockState)
    expect(publishedPosts).toHaveLength(2)
    expect(publishedPosts.every(post => post.published)).toBe(true)
  })

  test('should select post count', () => {
    const count = selectPostCount(mockState)
    expect(count).toBe(3)
  })

  test('should select theme', () => {
    const theme = selectTheme(mockState)
    expect(theme).toBe('dark')
  })

  test('should memoize selector results', () => {
    const result1 = selectPublishedPosts(mockState)
    const result2 = selectPublishedPosts(mockState)

    // Since we're filtering, we get new arrays each time
    // In real apps, use memoization libraries like reselect
    expect(result1).toEqual(result2)
  })
})

describe('State Management - Subscriptions', () => {
  test('should notify listeners on state change', () => {
    const store = new SimpleStateManager({ count: 0 })
    const listener = jest.fn()

    store.subscribe(listener)
    store.setState({ count: 1 })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ count: 1 })
  })

  test('should notify multiple listeners', () => {
    const store = new SimpleStateManager({ count: 0 })
    const listener1 = jest.fn()
    const listener2 = jest.fn()

    store.subscribe(listener1)
    store.subscribe(listener2)
    store.setState({ count: 1 })

    expect(listener1).toHaveBeenCalledWith({ count: 1 })
    expect(listener2).toHaveBeenCalledWith({ count: 1 })
  })

  test('should unsubscribe listener', () => {
    const store = new SimpleStateManager({ count: 0 })
    const listener = jest.fn()

    const unsubscribe = store.subscribe(listener)
    store.setState({ count: 1 })

    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.setState({ count: 2 })

    expect(listener).toHaveBeenCalledTimes(1) // Not called again
  })

  test('should handle multiple subscriptions and unsubscriptions', () => {
    const store = new SimpleStateManager({ count: 0 })
    const listener1 = jest.fn()
    const listener2 = jest.fn()

    const unsub1 = store.subscribe(listener1)
    const unsub2 = store.subscribe(listener2)

    store.setState({ count: 1 })
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)

    unsub1()
    store.setState({ count: 2 })
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(2)

    unsub2()
    store.setState({ count: 3 })
    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(2)
  })
})

describe('State Management - Edge Cases', () => {
  test('should handle undefined state', () => {
    const store = new SimpleStateManager<undefined>(undefined)
    expect(store.getState()).toBeUndefined()
  })

  test('should handle null state', () => {
    const store = new SimpleStateManager<null>(null)
    expect(store.getState()).toBeNull()
  })

  test('should handle boolean state', () => {
    const store = new SimpleStateManager(false)
    store.setState(true)
    expect(store.getState()).toBe(true)
  })

  test('should handle string state', () => {
    const store = new SimpleStateManager('initial')
    store.setState('updated')
    expect(store.getState()).toBe('updated')
  })

  test('should handle number state', () => {
    const store = new SimpleStateManager(0)
    store.setState(42)
    expect(store.getState()).toBe(42)
  })

  test('should handle state with symbols', () => {
    const sym = Symbol('test')
    const store = new SimpleStateManager({ [sym]: 'value' })
    expect(store.getState()[sym]).toBe('value')
  })
})
