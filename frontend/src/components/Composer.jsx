import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { SendIcon } from './Icons.jsx'

const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

const Composer = forwardRef(function Composer({ onSend, disabled, placeholder }, ref) {
  const [value, setValue] = useState('')
  const area = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => area.current?.focus(),
    setValue: (v) => setValue(v),
  }))

  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label htmlFor="composer-input" className="visually-hidden">Message Lantern</label>
      <textarea
        id="composer-input"
        ref={area}
        rows={1}
        value={value}
        maxLength={4000}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // On keyboards, Enter sends and Shift+Enter adds a line.
          // On phones, Enter adds a line and the button sends.
          if (e.key === 'Enter' && !e.shiftKey && !isTouch() && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button type="submit" className="send-btn" disabled={disabled || !value.trim()} aria-label="Send message">
        <SendIcon size={18} />
      </button>
    </form>
  )
})

export default Composer
