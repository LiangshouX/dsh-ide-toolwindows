/**
 * Small shared UI primitives: context menu, modal confirm, toast, shortcut
 * chip. All of them render inside the workbench root (no document.body
 * append), so theme tokens and stacking stay in one tree.
 */
import React, { useEffect, useRef, useState } from 'react'

/** One floating context menu anchored at a viewport point. */
export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const onDown = (event) => {
      if (ref.current !== null && !ref.current.contains(event.target)) onClose()
    }
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('blur', onClose)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('blur', onClose)
    }
  }, [onClose])
  const width = 210
  const height = items.length * 28 + 12
  const left = Math.min(x, (window.innerWidth ?? 1200) - width - 8)
  const top = Math.min(y, (window.innerHeight ?? 800) - height - 8)
  return React.createElement('div', {
    ref,
    className: 'itw-menu',
    style: { left: `${Math.max(6, left)}px`, top: `${Math.max(6, top)}px` },
    onContextMenu: event => event.preventDefault(),
  }, items.map((item, index) => {
    if (item === null) return React.createElement('div', { key: `sep-${index}`, className: 'itw-menu-sep' })
    if (item.label !== undefined && item.action === undefined) {
      return React.createElement('div', { key: `label-${index}`, className: 'itw-menu-label' }, item.label)
    }
    return React.createElement('button', {
      key: item.key ?? `item-${index}`,
      type: 'button',
      disabled: item.disabled === true,
      onClick: () => { onClose(); item.action?.() },
    }, item.icon ?? null, item.text)
  }))
}

/** Confirmation modal (danger actions always go through this). */
export function ConfirmModal({ dialog, onClose }) {
  if (dialog === null) return null
  return React.createElement('div', { className: 'itw-modal-backdrop', onMouseDown: event => { if (event.target === event.currentTarget) onClose() } },
    React.createElement('div', { className: 'itw-modal', role: 'dialog', 'aria-modal': 'true' },
      React.createElement('h2', null, dialog.title),
      React.createElement('p', null, dialog.body),
      React.createElement('div', { className: 'itw-modal-actions' },
        React.createElement('button', { type: 'button', className: 'itw-textbtn', onClick: onClose }, dialog.cancelLabel ?? 'Cancel'),
        React.createElement('button', {
          type: 'button',
          className: `itw-textbtn ${dialog.danger === false ? 'itw-primary' : 'itw-danger-solid'}`,
          autoFocus: true,
          onClick: () => { onClose(); dialog.onConfirm?.() },
        }, dialog.confirmLabel ?? 'Confirm'),
      ),
    ),
  )
}

/** Transient toast pinned above the status bar. */
export function Toast({ toast }) {
  if (toast === null || toast === undefined) return null
  return React.createElement('div', { className: `itw-toast itw-${toast.kind}` },
    React.createElement('div', { className: 'itw-toast-text' },
      React.createElement('div', null, toast.text),
      toast.detail !== '' && toast.detail !== undefined
        ? React.createElement('div', { className: 'itw-toast-detail' }, toast.detail)
        : null,
    ),
  )
}

/** Inline editable keyboard-shortcut chip (captures one combo). */
export function ShortcutCapture({ value, onCapture, active, onActivate }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return undefined
    const onKey = (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') { setArmed(false); onActivate?.(false); return }
      const parts = []
      if (event.ctrlKey) parts.push('Ctrl')
      if (event.altKey) parts.push('Alt')
      if (event.shiftKey) parts.push('Shift')
      if (event.metaKey) parts.push('Meta')
      let key = event.key
      if (key === ' ' || key === 'Spacebar') key = 'Space'
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return
      if (key.length === 1) key = key.toUpperCase()
      parts.push(key)
      onCapture(parts.join('+'))
      setArmed(false)
      onActivate?.(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [armed, onCapture, onActivate])
  useEffect(() => {
    if (active === false) setArmed(false)
  }, [active])
  return React.createElement('button', {
    type: 'button',
    className: `itw-settings-shortcut ${armed ? 'itw-capturing' : ''}`,
    onClick: () => { setArmed(true); onActivate?.(true) },
    title: 'Click and press the new shortcut',
  }, armed ? 'Press keys…' : value)
}

export function Kbd({ children }) {
  return React.createElement('span', { className: 'itw-kbd' }, children)
}

/* ── icons used across panels (inline, 14px) ─────────────────────────── */
export function ChevronRight({ size = 12 }) {
  return React.createElement('svg', { viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true },
    React.createElement('path', { d: 'M6 4l4 4-4 4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }))
}

export function ChevronDown({ size = 12 }) {
  return React.createElement('svg', { viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true },
    React.createElement('path', { d: 'M4 6l4 4 4-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }))
}
