import React from 'react'
import { getClientStyle, clientInitial } from '../lib/clients'

interface Props {
  presentClients: string[]
  selected: Set<string>
  onToggle: (id: string) => void
}

export function FilterChips({ presentClients, selected, onToggle }: Props) {
  return (
    <div className="filter-row">
      <span className="filter-label">Filter:</span>
      <div className="chip-row">
        {presentClients.map(id => {
          const style = getClientStyle(id)
          const isOn = selected.has(id)
          return (
            <button
              key={id}
              className={`chip ${isOn ? 'on' : 'off'}`}
              onClick={() => onToggle(id)}
              type="button"
            >
              <span className="chip-disc" style={{ background: style.color }}>
                {clientInitial(style.displayName)}
              </span>
              <span className="chip-label">{style.displayName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
