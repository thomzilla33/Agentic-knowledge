import { useEffect } from 'react'

/**
 * Global data-tt tooltip provider. Ported from voice-channel-ux.html.
 *
 * Mount once at the AppShell level. Listens to mouseover / mouseout /
 * focusin / focusout on the document and shows a single floating
 * tooltip element for any target with a `data-tt` attribute.
 */

const SHOW_DELAY_MS = 350

function isAnchorOpen(target: Element): boolean {
  return (
    target.classList.contains('sw-open') ||
    target.classList.contains('cm-open') ||
    target.classList.contains('ws-open')
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function Tooltip() {
  useEffect(() => {
    const tip = document.createElement('div')
    tip.className = 'tt'
    tip.setAttribute('role', 'tooltip')
    document.body.appendChild(tip)

    let showTimer: ReturnType<typeof setTimeout> | null = null
    let currentTarget: Element | null = null

    function show(target: Element): void {
      if (isAnchorOpen(target)) return
      const text = target.getAttribute('data-tt')
      if (!text) return
      const desc = target.getAttribute('data-tt-desc')
      if (desc) {
        tip.innerHTML =
          '<div class="tt__title">' + escapeHtml(text) + '</div>' +
          '<div class="tt__desc">' + escapeHtml(desc) + '</div>'
      } else {
        tip.textContent = text
      }
      const r = target.getBoundingClientRect()
      // Render off-screen first to measure
      tip.style.left = '-9999px'
      tip.style.top = '0px'
      tip.classList.add('open')
      const tw = tip.offsetWidth
      const th = tip.offsetHeight
      let left = r.left + r.width / 2 - tw / 2
      let top = r.bottom + 6
      if (left < 8) left = 8
      if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8
      if (top + th > window.innerHeight - 8) top = r.top - th - 6
      tip.style.left = left + 'px'
      tip.style.top = top + 'px'
      currentTarget = target
    }

    function hide(): void {
      if (showTimer !== null) {
        clearTimeout(showTimer)
        showTimer = null
      }
      tip.classList.remove('open')
      currentTarget = null
    }

    function onMouseOver(e: MouseEvent): void {
      const target = e.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-tt]')
      if (!el) return
      if (el === currentTarget) return
      if (showTimer !== null) clearTimeout(showTimer)
      if (currentTarget) hide()
      showTimer = setTimeout(() => show(el), SHOW_DELAY_MS)
    }

    function onMouseOut(e: MouseEvent): void {
      const target = e.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-tt]')
      if (!el) return
      const related = e.relatedTarget
      if (!(related instanceof Node) || !el.contains(related)) {
        hide()
      }
    }

    function onFocusIn(e: FocusEvent): void {
      const target = e.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-tt]')
      if (el) show(el)
    }

    function onFocusOut(e: FocusEvent): void {
      const target = e.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-tt]')
      if (el) hide()
    }

    function onClick(): void {
      if (currentTarget) hide()
    }

    function onScroll(): void {
      hide()
    }

    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll, true)
      if (showTimer !== null) clearTimeout(showTimer)
      tip.remove()
    }
  }, [])

  return null
}
