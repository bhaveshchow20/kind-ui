---
title: Use Lazy State Initialization
impact: MEDIUM
impactDescription: wasted computation on every render
tags: react, hooks, useState, performance, initialization
---

## Use Lazy State Initialization

Pass a function to `useState` for expensive initial values. Without the function form, the initializer runs on every render even though the value is only used once.

**Incorrect (runs on every render):**

```tsx
function FilteredList() {
  // buildSearchIndex() runs on EVERY render, even after initialization
  const [searchIndex, setSearchIndex] = useState(buildSearchIndex())
  const [query, setQuery] = useState('')

  // When query changes, buildSearchIndex runs again unnecessarily
  return <SearchResults index={searchIndex} query={query} />
}

```

**Correct (runs only once):**

This example builds an index from stable module-level data. If the index must
track changing props, derive it during render or use `useMemo` with those props
as dependencies instead of storing it as initial state.

```tsx
function FilteredList() {
  // buildSearchIndex() runs ONLY on initial render
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex())
  const [query, setQuery] = useState('')

  return <SearchResults index={searchIndex} query={query} />
}

```

Use lazy initialization when computing expensive initial values, such as building a stable index or parsing static configuration. A `useState` initializer runs only on mount; when a value must follow changing props, derive it during render or use `useMemo` with the appropriate dependencies. Do not read `localStorage`, `sessionStorage`, or other browser-only APIs during render in server-rendered components; load those values after hydration or keep the component explicitly browser-only.

For simple primitives (`useState(0)`), direct references (`useState(props.value)`), or cheap literals (`useState({})`), the function form is unnecessary.
