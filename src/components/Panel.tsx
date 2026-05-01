import React from 'react'

export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="outer-panel">{children}</div>
}
