'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import type { Player } from '@/types'

interface PlayerComboboxProps {
  players: Player[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

const POSITION_LABEL: Record<string, string> = {
  GK: 'POR',
  DF: 'DEF',
  MF: 'MED',
  FW: 'DEL',
}

export function PlayerCombobox({
  players,
  value,
  onChange,
  placeholder = 'Seleccionar jugador…',
  disabled = false,
}: PlayerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = players.find((p) => p.id === value) ?? null

  const filtered = search.trim()
    ? players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.position?.toLowerCase().includes(search.toLowerCase())
      )
    : players

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = (playerId: string) => {
    onChange(playerId === value ? null : playerId)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
      setSearch('')
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left
          ${open ? 'border-ring ring-1 ring-ring' : 'border-input'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'bg-background hover:bg-muted/50 cursor-pointer'}`}
      >
        <span className={selected ? 'font-medium' : 'text-muted-foreground'}>
          {selected ? selected.name : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador…"
              className="w-full text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
            ) : (
              filtered.map((p) => {
                const isSelected = p.id === value
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors
                        ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.position && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                            ${p.position === 'GK' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              p.position === 'DF' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              p.position === 'MF' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {POSITION_LABEL[p.position] ?? p.position}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
