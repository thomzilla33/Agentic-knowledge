import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, ChevronRight, Save, Sparkles, Check, Edit, X,
  Shield, Database, Folder, Lock, FileText, Wand2,
} from 'lucide-react'
import {
  availableTenants, accessDepartments,
  availableTruthFacts, availableSandboxClaims, availableSourceDocs,
} from '../../../data/mockKnowledge'

// ════════════════════════════════════════════════════════════════════════════
// Knowledge Pack Copilot — full-screen modal
// ────────────────────────────────────────────────────────────────────────────
// Mirrors the manual builder step-by-step. The Copilot proposes recommended
// answers (badged "Recommended") at every step; the user can accept with a
// single click or override. No Lex branding — generic AI avatar.
//
// Question order follows the builder exactly:
//   1. Identity (name + description)
//   2. Owner & Department  (auto-suggested from current user + name)
//   3. Composition         (AI-suggested items per plane)
//   4. Default toggles     (AI-recommended preset)
//   5. Tenant scope        (Global / Workspace + tenants)
//   6. Permissions         (Tier)
//   7. Review              (Recap + Save as draft)
//
// Props:
//   open         — boolean, modal visibility
//   onBack       — return to mode picker
//   onClose      — dismiss the entire creation flow
//   onComplete   — (data) => void, save-as-draft handoff
// ════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY    = 'kp-chat-state-v2'
const HANDOFF_KEY    = 'kp-chat-handoff'
const AIMS_GRADIENT  = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 100%)'
const AI_GRADIENT    = 'linear-gradient(135deg,#00C2C2 0%,#155DFC 50%,#a78bfa 100%)'

const STEPS = [
  { id: 'purpose',     label: 'Purpose'               },  // What kind of pack: Restrict / Add / Both
  { id: 'identity',    label: 'Identity'              },
  { id: 'ownership',   label: 'Owner & department'    },
  { id: 'composition', label: 'Composition'           },
  { id: 'toggles',     label: 'Default toggles'       },
  { id: 'scope',       label: 'Tenant scope'          },
  { id: 'permissions', label: 'Permissions'           },
  { id: 'review',      label: 'Review'                },
]

const INITIAL_STATE = {
  // intent — set in the first step. 'restrict' = constrain visible facts;
  // 'add' = bring tribal knowledge; 'both' = combination. Drives which
  // planes/items are offered later (e.g. 'restrict' hides sandbox+sources).
  intent: null,
  // Workflow context — populated when the Copilot is launched from Agentic
  // Studio (via ?workflowId=...&workflowName=... URL params). Used to anchor
  // the conversation and link the resulting pack to the originating workflow.
  workflowId: null,
  workflowName: null,
  name: '',
  description: '',
  owner: 'Sarah Chen',
  department: '',
  truth: [], sandbox: [], sources: [],
  toggles: { truth: true, sandbox: false, sources: true },
  scope: null,             // 'global' | 'workspace'
  tenantMode: 'all',       // 'all' | 'specific'
  tenants: [],
  access: { tier: null },  // 'workspace' | 'departments' | 'custom'
  step: 0,
}

// Heuristic department inference from a pack name.
function inferDepartment(name = '') {
  const n = name.toLowerCase()
  if (/sales|sdr|ae\b|outbound|discovery|qualification|pipeline/.test(n)) return 'Sales'
  if (/support|sla|ticket|escalat/.test(n))                                return 'Support'
  if (/onboard|customer success|csm|adoption|activation/.test(n))          return 'Customer Success'
  if (/gdpr|compliance|policy|audit|risk/.test(n))                         return 'Compliance'
  if (/legal|contract|nda|msa/.test(n))                                    return 'Legal'
  if (/finance|invoice|budget|forecast/.test(n))                           return 'Finance'
  if (/hr|people|recruit|hiring/.test(n))                                  return 'HR'
  if (/market|brand|content|seo/.test(n))                                  return 'Marketing'
  if (/eng|product|infra|technol/.test(n))                                 return 'Engineering'
  return ''
}

// ─────────────────────────────────────────────────────────────────────────
// Mock content suggestions when the user accepts AI seeding.
//
// Intent-aware: 'restrict' seeds Truth-only (the pack guardrails what the
// agent sees); 'add' seeds Sandbox + Sources only (new context not in Truth
// yet); 'both' seeds all three planes. PII items are excluded — they require
// compliance review and can't be auto-suggested.
// ─────────────────────────────────────────────────────────────────────────
const notPii = (x) => x.accessLevel !== 'pii'

function suggestComposition(intent = 'both') {
  if (intent === 'restrict') {
    return {
      truth:   availableTruthFacts.filter(notPii).slice(0, 5).map(f => f.id),
      sandbox: [],
      sources: [],
    }
  }
  if (intent === 'add') {
    return {
      truth:   [],
      sandbox: availableSandboxClaims.filter(notPii).slice(0, 4).map(c => c.id),
      sources: availableSourceDocs.filter(notPii).slice(0, 5).map(s => s.id),
    }
  }
  return {  // both
    truth:   availableTruthFacts.filter(notPii).slice(0, 5).map(f => f.id),
    sandbox: availableSandboxClaims.filter(notPii).slice(0, 4).map(c => c.id),
    sources: availableSourceDocs.filter(notPii).slice(0, 5).map(s => s.id),
  }
}
// A lighter starter pack — useful when the recommended seeding feels heavy.
function suggestSmallComposition(intent = 'both') {
  if (intent === 'restrict') {
    return { truth: availableTruthFacts.filter(notPii).slice(0, 2).map(f => f.id), sandbox: [], sources: [] }
  }
  if (intent === 'add') {
    return { truth: [], sandbox: availableSandboxClaims.filter(notPii).slice(0, 2).map(c => c.id), sources: availableSourceDocs.filter(notPii).slice(0, 2).map(s => s.id) }
  }
  return {
    truth:   availableTruthFacts.filter(notPii).slice(0, 2).map(f => f.id),
    sandbox: availableSandboxClaims.filter(notPii).slice(0, 2).map(c => c.id),
    sources: availableSourceDocs.filter(notPii).slice(0, 2).map(s => s.id),
  }
}

// Mock universe sizes — represent enterprise-realistic scale so the
// AI-filtering message conveys real value ("23 of 8,400 facts"). These
// numbers stay consistent everywhere they appear in the prototype.
const MOCK_UNIVERSE = {
  truthFacts:     8400,
  sandboxClaims:  1200,
  sourceDocs:     2100,
}

// What the AI claims to have filtered down to per intent. Anchored to Mike's
// "narrowed to ~23" from the call; restrict and add show smaller subsets.
function aiMatchSummary(intent) {
  if (intent === 'restrict') return { matched: 14, fromUniverse: MOCK_UNIVERSE.truthFacts, label: 'truth plane facts' }
  if (intent === 'add')      return { matched: 11, fromUniverse: MOCK_UNIVERSE.sandboxClaims + MOCK_UNIVERSE.sourceDocs, label: 'sandbox claims + source docs not yet in truth' }
  return                            { matched: 23, fromUniverse: MOCK_UNIVERSE.truthFacts + MOCK_UNIVERSE.sandboxClaims + MOCK_UNIVERSE.sourceDocs, label: 'truth + sandbox + sources combined' }
}

// ════════════════════════════════════════════════════════════════════════════
export default function KnowledgePackChat({ open, onBack, onClose, onComplete }) {
  const navigate = useNavigate()
  const [data, setData]               = useState(() => loadState())
  const [messages, setMessages]       = useState(() => buildInitialTranscript())
  const [pendingInput, setPendingInput] = useState('')
  const [isTyping, setIsTyping]       = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)
  // D5 — if the user closed mid-draft and re-opens the Copilot, ask whether
  // to resume or start fresh instead of silently restoring. Re-checks on
  // every transition from closed→open so a draft persisted *after* the
  // component first mounted still triggers the prompt.
  const [resumePrompt, setResumePrompt] = useState(() => {
    const initial = loadState()
    return (initial?.step || 0) > 0
  })
  const scrollRef = useRef(null)
  // dataRef always reflects the latest data state, so handlers bound to a
  // chip in an earlier render (before subsequent setData calls were applied)
  // can still read fresh values when they fire. Avoids stale-closure bugs
  // across the multi-step wizard chain.
  const dataRef = useRef(data)
  dataRef.current = data

  // Persist state every change so a refresh doesn't kill progress.
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
  }, [data])

  // Autoscroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  // Reset when modal closes externally
  useEffect(() => {
    if (!open) return
    // Lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // D5 — every time the Copilot transitions from closed → open, re-check
  // sessionStorage. The state was initialized at the component's *first*
  // mount, which can be earlier than when the user re-opens the Copilot
  // after persisting a draft. Without this, the resume prompt only fires
  // for drafts already present at first mount.
  useEffect(() => {
    if (!open) return
    const fresh = loadState()
    if ((fresh?.step || 0) > 0) {
      setData(fresh)
      setResumePrompt(true)
    }
  }, [open])

  // ESC = back to mode picker (unless mid-conversation, then confirm)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (data.step > 0) setExitConfirm(true)
      else onBack?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, data.step, onBack])

  // Bootstrap: whenever the chat opens with an empty transcript (fresh
  // session, page refresh, or "Start over"), fire the purpose question.
  // If the user had already chosen an intent in a prior session, pre-mark
  // it as Recommended so they can re-confirm with one click.
  useEffect(() => {
    if (!open) return
    if (messages.length > 0) return
    askPurpose(data.intent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messages.length])

  if (!open) return null

  // ── Helpers ──────────────────────────────────────────────────────────────
  const speak = (text, opts = {}, delay = 450) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'ai', text, ...opts }])
    }, delay)
  }
  const reply = (text) => setMessages(prev => [...prev, { role: 'user', text }])

  // ════════════════════════════════════════════════════════════════════════
  // Step 0 — Purpose (intent: restrict / add / both)
  //
  // Mike's mental model: a pack is either a guardrail ("only look at these
  // facts"), an extension ("bring in knowledge that isn't in truth yet"), or
  // both. We ask this BEFORE anything else because it changes what gets
  // suggested in the composition step.
  // ════════════════════════════════════════════════════════════════════════
  const askPurpose = (recommendedValue = null) => {
    // When launched from a workflow context (Agentic Studio "Knowledge" CTA),
    // anchor the question with the workflow name so the user knows the AI
    // already knows what they're working on.
    const wf = dataRef.current.workflowName
    const opener = wf
      ? `You're adding a knowledge constraint for **${wf}**. First — what do you need this pack to do?`
      : "First — what do you need this pack to do?"
    speak(
      opener,
      {
        suggestions: [
          { label: 'Restrict knowledge',  value: 'restrict', recommended: recommendedValue === 'restrict' },
          { label: 'Add knowledge',       value: 'add',      recommended: recommendedValue === 'add'      },
          { label: 'Restrict and add',    value: 'both',     recommended: recommendedValue === 'both'     },
        ],
        onChip: handlePurposeChip,
      },
      250  // shorter delay for the very first message
    )
  }

  const handlePurposeChip = (value, label) => {
    const labels = { restrict: 'Restrict knowledge', add: 'Add knowledge', both: 'Restrict and add' }
    setData(d => ({ ...d, intent: value, step: 1 }))
    reply(label || labels[value] || value)
    // Identity prompt — text adapts to intent so the user knows what to focus on.
    const intro =
      value === 'restrict' ? "Got it — we'll keep this focused. What should we call the pack? Add a one-line description after a dash if you like." :
      value === 'add'      ? "Got it — we'll add new knowledge. What should we call the pack? Add a one-line description after a dash if you like." :
                             "Got it — we'll restrict and add. What should we call the pack? Add a one-line description after a dash if you like."
    speak(intro + " For example: *Sales Discovery — ICP, qualification, and discovery scripts.*")
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 1 — Identity (name + description from one free-text answer)
  // ════════════════════════════════════════════════════════════════════════
  const submitIdentity = () => {
    const text = pendingInput.trim()
    if (!text) return
    const parts = text.split(/[.\n—–-]/)
    const name = parts[0].trim().slice(0, 80)
    const description = parts.slice(1).join('. ').trim()
    const inferredDept = inferDepartment(name)
    setData(d => ({ ...d, name, description, department: inferredDept, step: 2 }))
    reply(text)
    setPendingInput('')

    // Owner & department prompt: confirm with AI suggestion
    const dept = inferredDept || 'Cross-departmental'
    speak(
      `Owner is **${INITIAL_STATE.owner}** (you) and department is **${dept}**. Sound right?`,
      {
        suggestions: [
          { label: 'Yes, accept both', value: 'accept', recommended: true },
          { label: 'Change owner',     value: 'changeOwner' },
          { label: 'Change department',value: 'changeDept'  },
        ],
        onChip: handleOwnershipChip,
      }
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 2 — Owner & Department
  // ════════════════════════════════════════════════════════════════════════
  const handleOwnershipChip = (value, label) => {
    if (value === 'accept') {
      reply(label || 'Yes, accept both')
      setData(d => ({ ...d, step: 3 }))
      askComposition()
      return
    }
    if (value === 'changeOwner') {
      reply(label || 'Change owner')
      speak('Pick the new owner.', {
        ownerPicker: true,
        onOwner: (newOwner) => {
          setData(d => ({ ...d, owner: newOwner }))
          reply(newOwner)
          speak(`Owner updated to **${newOwner}**. Department stays as **${dataRef.current.department || 'Cross-departmental'}**?`, {
            suggestions: [
              { label: 'Yes, continue', value: 'continueDept', recommended: true },
              { label: 'Change department', value: 'changeDept' },
            ],
            onChip: handleOwnershipChip,
          })
        },
      })
      return
    }
    if (value === 'continueDept') {
      reply(label || 'Yes, continue')
      setData(d => ({ ...d, step: 3 }))
      askComposition()
      return
    }
    if (value === 'changeDept') {
      reply(label || 'Change department')
      speak('Pick a department or skip if cross-departmental.', {
        deptPicker: true,
        onDept: (newDept) => {
          setData(d => ({ ...d, department: newDept || '', step: 3 }))
          reply(newDept || 'Cross-departmental')
          askComposition()
        },
      })
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 3 — Composition (AI-filtered items per plane)
  //
  // The AI prompt frames the scale problem Mike called out: the user has
  // hundreds of thousands of facts and can't pick manually. We show the
  // ratio: "matched X of Y" so the user sees the filter doing real work.
  // ════════════════════════════════════════════════════════════════════════
  const askComposition = () => {
    // Read latest state via dataRef — fired from a chip handler bound several
    // renders ago, plain `data` closure here may not yet reflect identity.
    const latest = dataRef.current
    const intent = latest.intent || 'both'
    const name   = latest.name?.trim() || 'this workflow'
    const { matched, fromUniverse, label: universeLabel } = aiMatchSummary(intent)
    const seedPreview = suggestComposition(intent)
    const preselect = seedPreview.truth.length + seedPreview.sandbox.length + seedPreview.sources.length

    const message =
      intent === 'restrict'
        ? `Scanned **${fromUniverse.toLocaleString()} indexed ${universeLabel}** for facts relevant to **${name}**. Found **${matched} matches** — I'll pre-select the top **${preselect}** by confidence.`
      : intent === 'add'
        ? `Looked across **${fromUniverse.toLocaleString()} ${universeLabel}** for context not already in your truth plane. Found **${matched} candidates** — I'll pre-select the top **${preselect}** by relevance.`
        : `Scanned across **${fromUniverse.toLocaleString()}** total items (${universeLabel}) for **${name}**. Found **${matched} matches** — I'll pre-select the top **${preselect}** by confidence.`

    speak(
      message,
      {
        suggestions: [
          { label: `Use the ${preselect} suggested`,    value: 'suggest', recommended: true },
          { label: 'Smaller starter',                    value: 'small' },
          { label: 'Skip — empty pack',                  value: 'skip' },
        ],
        onChip: handleCompositionChip,
      }
    )
  }

  const handleCompositionChip = (value, label) => {
    const intent = dataRef.current.intent || 'both'
    if (value === 'suggest' || value === 'small') {
      const seeds = value === 'suggest' ? suggestComposition(intent) : suggestSmallComposition(intent)
      setData(d => ({ ...d, ...seeds, step: 4 }))
      // Use the chip label verbatim if available (handles free-text path too).
      reply(label || (value === 'suggest' ? 'Use suggested items' : 'Smaller starter'))
      // Plane breakdown adapts to the intent: planes with 0 items are omitted.
      const parts = [
        seeds.truth.length   > 0 && `${seeds.truth.length} Truth`,
        seeds.sandbox.length > 0 && `${seeds.sandbox.length} Sandbox`,
        seeds.sources.length > 0 && `${seeds.sources.length} Sources`,
      ].filter(Boolean).join(' · ')
      const total = seeds.truth.length + seeds.sandbox.length + seeds.sources.length
      speak(`Added ${parts} — ${total} item${total === 1 ? '' : 's'} in your pack.`)
      askToggles()
    } else {
      setData(d => ({ ...d, step: 4 }))
      reply(label || 'Skip — empty pack')
      askToggles()
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 4 — Default toggles
  // ════════════════════════════════════════════════════════════════════════
  const askToggles = () => {
    speak(
      `On attach, which planes should be active by default? Recommended preset: **Truth on · Sandbox off · Sources on**.`,
      {
        suggestions: [
          { label: 'Use recommended preset', value: 'preset', recommended: true },
          { label: 'All planes active',      value: 'all' },
          { label: 'Customize',              value: 'custom' },
        ],
        onChip: handleTogglesChip,
      }
    )
  }

  const handleTogglesChip = (value, label) => {
    if (value === 'preset') {
      setData(d => ({ ...d, toggles: { truth: true, sandbox: false, sources: true }, step: 5 }))
      reply(label || 'Use recommended preset')
      askScope()
    } else if (value === 'all') {
      setData(d => ({ ...d, toggles: { truth: true, sandbox: true, sources: true }, step: 5 }))
      reply(label || 'All planes active')
      askScope()
    } else {
      reply(label || 'Customize')
      speak('Toggle each plane to your preferred default.', {
        togglePicker: true,
        onConfirm: (toggles) => {
          setData(d => ({ ...d, toggles, step: 5 }))
          const summary = Object.entries(toggles).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'
          reply(`Defaults: ${summary}`)
          askScope()
        },
      })
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 5 — Tenant scope
  // ════════════════════════════════════════════════════════════════════════
  const askScope = () => {
    speak(
      `Where should this pack live? Recommended for cross-team packs: **Global · all tenants**.`,
      {
        suggestions: [
          { label: 'Global · all tenants',         value: 'global',             recommended: true },
          { label: 'Workspace · all tenants',      value: 'workspace-all'       },
          { label: 'Workspace · specific tenants', value: 'workspace-specific'  },
        ],
        onChip: handleScopeChip,
      }
    )
  }

  const handleScopeChip = (value, label) => {
    if (value === 'global') {
      setData(d => ({ ...d, scope: 'global', tenantMode: 'all', tenants: [], step: 6 }))
      reply(label || 'Global · all tenants')
      askPermissions('Global')
      return
    }
    if (value === 'workspace-all') {
      setData(d => ({ ...d, scope: 'workspace', tenantMode: 'all', tenants: [], step: 6 }))
      reply(label || 'Workspace · all tenants')
      askPermissions('all tenants')
      return
    }
    // workspace-specific (or legacy 'workspace')
    setData(d => ({ ...d, scope: 'workspace' }))
    reply(label || 'Workspace · specific tenants')
    speak('Pick the tenants — choose one or many.', {
      tenantPicker: true,
      onTenants: (mode, tenantIds) => {
        setData(d => ({ ...d, tenantMode: mode, tenants: tenantIds, step: 6 }))
        const summary = mode === 'all'
          ? 'All tenants in this workspace'
          : `${tenantIds.length} tenant${tenantIds.length === 1 ? '' : 's'} selected`
        reply(summary)
        askPermissions(mode === 'all' ? 'all tenants' : `${tenantIds.length} tenants`)
      },
    })
  }

  // ════════════════════════════════════════════════════════════════════════
  // Step 6 — Permissions
  // ════════════════════════════════════════════════════════════════════════
  const askPermissions = (scopeLabel) => {
    speak(
      `Within ${scopeLabel}, who can use this pack? Recommended: **Anyone with tenant access**.`,
      {
        suggestions: [
          { label: 'Anyone with tenant access', value: 'workspace', recommended: true },
          { label: 'Specific departments',      value: 'departments' },
          { label: 'Custom rule',               value: 'custom' },
        ],
        onChip: handlePermissionsChip,
      }
    )
  }

  const handlePermissionsChip = (value, label) => {
    setData(d => ({ ...d, access: { tier: value }, step: 7 }))
    const defaultLabel = value === 'workspace' ? 'Anyone with tenant access' :
                         value === 'departments' ? 'Specific departments' : 'Custom rule'
    reply(label || defaultLabel)
    // The summary card pulls from live `data` (passed as a prop) so we don't
    // need to snapshot — avoids stale-closure bugs across the wizard chain.
    speak("All set — here's the summary of your pack. Save it as a draft when you're ready; you can publish from the Knowledge list later.",
      { summary: true })
  }

  // ════════════════════════════════════════════════════════════════════════
  // Terminal actions
  // ════════════════════════════════════════════════════════════════════════
  // Composer handler — accepts a typed answer and routes it to the same
  // handlers as the recommended chips. Either path (click or type) advances
  // the wizard. If the text doesn't match any option, AIMS AI asks the user
  // to rephrase or pick a chip.
  const handleSend = () => {
    const text = pendingInput.trim()
    if (!text) return
    // Identity step takes free text directly (name + description). Other steps
    // route through parseFreeText to match the user's text against chip options.
    if (data.step === 1) { submitIdentity(); return }
    const value = parseFreeText(text, data.step)
    setPendingInput('')
    if (!value) {
      reply(text)
      speak("I didn't catch a clear answer there. Try one of the options below, or rephrase a bit.")
      return
    }
    // Dispatch to the matching chip handler — pass the user's text as the
    // label so it appears verbatim in the chat instead of the chip label.
    if      (data.step === 0) handlePurposeChip(value, text)
    else if (data.step === 2) handleOwnershipChip(value, text)
    else if (data.step === 3) handleCompositionChip(value, text)
    else if (data.step === 4) handleTogglesChip(value, text)
    else if (data.step === 5) handleScopeChip(value, text)
    else if (data.step === 6) handlePermissionsChip(value, text)
  }

  // Map free text → option value per step. Lenient matching by keyword.
  function parseFreeText(text, step) {
    const t = text.toLowerCase()
    switch (step) {
      case 0: // Purpose
        if (/restrict.*(and|&|\+).*add|both|extend.*and.*restrict/i.test(t))            return 'both'
        if (/^(restrict|limit|filter|constrain|guardrail|narrow)/i.test(t))             return 'restrict'
        if (/^(add|extend|bring|teach|tribal)/i.test(t))                                return 'add'
        return null
      case 2: // Owner & department
        if (/^(yes|y|sure|ok+|accept|sounds? good|good|both|correct|right|👍)/i.test(t)) return 'accept'
        if (/change.*owner|different owner|new owner|other owner/i.test(t))             return 'changeOwner'
        if (/change.*dep|different dep|other dep|new dep/i.test(t))                     return 'changeDept'
        return null
      case 3: // Composition
        if (/smaller|small|light|minimal|2\+2\+2/i.test(t))                             return 'small'
        if (/^(yes|y|sure|ok+|please|suggest|recommend|big|full)/i.test(t))             return 'suggest'
        if (/^(no|n|skip|empty|later|myself|i'?ll pick)/i.test(t))                      return 'skip'
        return null
      case 4: // Default toggles
        if (/all (planes? )?(active|on|enabled)?|every plane|enable all/i.test(t))     return 'all'
        if (/preset|recommend|^(yes|y|sure|ok+|use)/i.test(t))                          return 'preset'
        if (/custom|change|configure|adjust|toggle/i.test(t))                           return 'custom'
        return null
      case 5: // Tenant scope
        if (/\bglobal\b|cross[- ]?team|cross[- ]?tenant/i.test(t))                      return 'global'
        if (/workspace.*(specific|pick|select|choose)|specific tenants?/i.test(t))      return 'workspace-specific'
        if (/workspace.*(all|every)|workspace$/i.test(t))                               return 'workspace-all'
        if (/all tenants?|everyone/i.test(t))                                           return 'global'
        if (/\bspecific\b|pick|choose tenant/i.test(t))                                 return 'workspace-specific'
        if (/\bworkspace\b/i.test(t))                                                   return 'workspace-all'
        return null
      case 6: // Permissions
        if (/anyone|tenant access|everybody|everyone/i.test(t))                         return 'workspace'
        if (/department/i.test(t))                                                      return 'departments'
        if (/custom|specific|rule/i.test(t))                                            return 'custom'
        return null
      default:
        return null
    }
  }

  const handleSaveDraft = () => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    onComplete?.(data)
  }

  const handleOpenInBuilder = () => {
    try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(data)) } catch {}
    onClose?.()
    navigate('/intelligence-library/knowledge/create/scratch?fromCopilot=1')
  }

  const handleStartOver = () => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    setData(INITIAL_STATE)
    setMessages(buildInitialTranscript())
    setPendingInput('')
    setExitConfirm(false)
  }

  const exit = (force = false) => {
    if (!force && data.step > 0) { setExitConfirm(true); return }
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    onClose?.()
  }

  const showRecap = data.step >= STEPS.length - 1

  // Detect embed mode: when rendered inside the Agentic Studio iframe (?embed=1),
  // the parent already provides the modal chrome (slide-out / fullscreen overlay).
  // We must NOT render our own backdrop + padded panel — that produces a doubled frame.
  const isEmbedded = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('embed') === '1'

  // ════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════
  const panelContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-copilot-modal-title"
      className={
        isEmbedded
          ? 'flex flex-col w-full h-full overflow-hidden'
          : 'fixed inset-0 z-[9000] flex items-center justify-center'
      }
      style={
        isEmbedded
          ? { background: 'var(--modal-bg, #0b1220)' }
          : { background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', padding: '20px 60px' }
      }
      onClick={isEmbedded ? undefined : (e) => { if (e.target === e.currentTarget) exit(false) }}
    >
      <div
        className={
          isEmbedded
            ? 'flex flex-col overflow-hidden w-full h-full'
            : 'rounded-2xl shadow-2xl flex flex-col overflow-hidden'
        }
        style={
          isEmbedded
            ? { background: 'var(--modal-bg, #0b1220)' }
            : {
                width: 'calc(100vw - 120px)',
                height: 'calc(100vh - 40px)',
                background: 'var(--modal-bg, #0b1220)',
                border: '1px solid var(--border-subtle)',
              }
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => exit(false)}
              aria-label="Back to mode picker"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={14} />
            </button>
            <CopilotAvatar size={32} />
            <p id="kp-copilot-modal-title" className="text-base font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}>
              AIMS AI
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleStartOver} title="Start a fresh conversation"
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer min-h-[34px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              Start over
            </button>
            <button onClick={handleOpenInBuilder}
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all hover:brightness-125 cursor-pointer min-h-[34px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              title="Hand off to the manual builder"
            >
              <Edit size={11} /> Edit in builder
            </button>
            <button onClick={() => exit(false)} aria-label="Close copilot"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body: chat + recap */}
        <div className="flex flex-1 min-h-0">
          {/* Chat column */}
          <main className="flex-1 flex flex-col min-w-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              aria-live="polite" aria-label="Conversation with Copilot">
              {messages.map((m, i) => (
                <ChatBubble key={i} msg={m} data={data} />
              ))}
              {isTyping && <TypingBubble />}
            </div>

            {/* Action bar — only at recap; sits above the composer */}
            {showRecap && (
              <div className="px-6 py-3 flex items-center gap-2"
                style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                <button onClick={handleOpenInBuilder}
                  className="px-4 py-2 rounded-lg flex items-center gap-1.5 text-[12px] font-semibold transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <Edit size={12} /> Edit in builder
                </button>
                <button onClick={handleSaveDraft}
                  className="ml-auto px-5 py-2 rounded-lg flex items-center gap-2 text-[12px] font-semibold transition-all hover:brightness-110 cursor-pointer"
                  style={{ background: AIMS_GRADIENT, color: '#fff', boxShadow: '0 2px 12px rgba(21,93,252,0.45)' }}
                >
                  <Save size={12} /> Save as draft <ChevronRight size={12} />
                </button>
              </div>
            )}

            {/* Composer — always visible. Identity step submits the form;     */}
            {/* later steps post free-form notes that AIMS AI acknowledges.   */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <label className="block">
                <span className="sr-only">Your message</span>
                <div className="flex items-end gap-2 p-2 rounded-2xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <textarea
                    value={pendingInput}
                    onChange={(e) => setPendingInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                    }}
                    placeholder={
                      data.step === 0
                        ? 'Pick an option above — or type "restrict", "add", or "both".'
                        : data.step === 1
                        ? 'e.g. Sales Discovery — ICP, qualification, and discovery scripts.'
                        : 'Type your answer or pick an option above — for example, "global", "skip", "yes accept".'
                    }
                    rows={2}
                    className="flex-1 bg-transparent outline-none text-[13px] resize-none px-2 py-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button onClick={handleSend} disabled={!pendingInput.trim()}
                    aria-label="Send message"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:brightness-110 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ background: AIMS_GRADIENT, color: '#fff' }}
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Press <kbd className="px-1 rounded font-mono"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>Enter</kbd> to send · <kbd className="px-1 rounded font-mono"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>Shift+Enter</kbd> for a new line
                </p>
              </label>
            </div>
          </main>

        </div>
      </div>

      {/* Exit confirm */}
      {exitConfirm && (
        <ConfirmDialog
          title="Leave the conversation?"
          body="Progress is saved automatically. You can resume from the Knowledge list."
          cancel="Keep going"
          confirm="Leave"
          onCancel={() => setExitConfirm(false)}
          onConfirm={() => exit(true)}
        />
      )}
      {/* D5 — Resume-or-fresh prompt when re-opening with an in-progress draft */}
      {resumePrompt && (
        <ResumeFreshDialog
          stepNumber={data.step}
          totalSteps={STEPS.length}
          packName={data.name}
          intent={data.intent}
          onResume={() => setResumePrompt(false)}
          onFresh={() => {
            // Clear storage, reset to a clean state, but preserve URL context
            // (workflowId, workflowName, intent) when the Copilot was launched
            // from another product.
            try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
            const reset = loadState() // re-runs URL-merge against empty storage
            setData(reset)
            setMessages(buildInitialTranscript())
            setPendingInput('')
            setResumePrompt(false)
          }}
        />
      )}
    </div>
  )

  // In embed mode render inline (the iframe IS the modal chrome).
  // In standalone mode portal into body so we sit above app chrome.
  return isEmbedded ? panelContent : createPortal(panelContent, document.body)
}

// ════════════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════════════

function CopilotAvatar({ size = 32 }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 relative"
      style={{
        width: size, height: size,
        background: AI_GRADIENT,
        boxShadow: '0 2px 10px rgba(43,127,255,0.40)',
      }}>
      <Sparkles size={size * 0.45} color="#fff" strokeWidth={2.5} />
    </div>
  )
}

function ChatBubble({ msg, data }) {
  if (msg.role === 'ai') {
    return (
      <div className="flex items-start gap-3 max-w-3xl">
        <CopilotAvatar size={28} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-md inline-block"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            <p className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
          </div>
          {msg.suggestions && (
            <div className="flex flex-wrap gap-1.5">
              {msg.suggestions.map(s => (
                <button key={s.value}
                  onClick={() => msg.onChip?.(s.value)}
                  className="relative px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:brightness-125 cursor-pointer min-h-[34px] flex items-center gap-1.5"
                  style={{
                    background: s.recommended ? 'rgba(43,127,255,0.16)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${s.recommended ? 'rgba(43,127,255,0.45)' : 'var(--border-subtle)'}`,
                    color: s.recommended ? '#80AFFF' : 'var(--text-secondary)',
                  }}
                >
                  {s.recommended && <Sparkles size={10} />}
                  {s.label}
                  {s.recommended && (
                    <span className="text-[8px] font-bold tracking-wider uppercase px-1 py-0.5 rounded ml-0.5"
                      style={{ background: 'rgba(43,127,255,0.20)', color: '#80AFFF' }}>
                      Recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {msg.tenantPicker   && <TenantPickerBubble onConfirm={msg.onTenants} />}
          {msg.ownerPicker    && <OwnerPickerBubble  onConfirm={msg.onOwner}  />}
          {msg.deptPicker     && <DeptPickerBubble   onConfirm={msg.onDept}   />}
          {msg.togglePicker   && <TogglePickerBubble onConfirm={msg.onConfirm} />}
          {msg.summary       && data && <ChatSummaryCard data={data} />}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 justify-end max-w-3xl ml-auto">
      <div className="px-4 py-2.5 rounded-2xl rounded-tr-md inline-block"
        style={{ background: AIMS_GRADIENT, color: '#fff', boxShadow: '0 1px 6px rgba(21,93,252,0.30)' }}>
        <p className="text-[13px] leading-relaxed">{msg.text}</p>
      </div>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)' }}>
        SC
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-3">
      <CopilotAvatar size={28} />
      <div className="px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <Dot delay={0}/><Dot delay={150}/><Dot delay={300}/>
      </div>
    </div>
  )
}

function Dot({ delay }) {
  return (
    <span className="w-1.5 h-1.5 rounded-full inline-block"
      style={{ background: 'var(--text-muted)', animation: `kp-chat-dot 1.2s ${delay}ms ease-in-out infinite` }}
    />
  )
}

// ── Inline picker bubbles ───────────────────────────────────────────────────

function OwnerPickerBubble({ onConfirm }) {
  const [val, setVal] = useState('')
  const presets = ['Sarah Chen', 'Marcus Wong', 'Alex Rivera', 'James Park']
  return (
    <div className="rounded-xl p-3 max-w-md"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {presets.map(p => (
          <button key={p} onClick={() => onConfirm(p)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[34px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Or type a name…"
          className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        />
        <button onClick={() => val.trim() && onConfirm(val.trim())} disabled={!val.trim()}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40"
          style={{ background: AIMS_GRADIENT, color: '#fff' }}>
          Set
        </button>
      </div>
    </div>
  )
}

function DeptPickerBubble({ onConfirm }) {
  return (
    <div className="rounded-xl p-3 max-w-md"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-wrap gap-1.5">
        {accessDepartments.map(d => (
          <button key={d} onClick={() => onConfirm(d)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[34px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            {d}
          </button>
        ))}
        <button onClick={() => onConfirm('')}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[34px]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)' }}>
          Skip — cross-departmental
        </button>
      </div>
    </div>
  )
}

function TenantPickerBubble({ onConfirm }) {
  const [mode, setMode] = useState('all')
  const [picked, setPicked] = useState([])
  return (
    <div className="rounded-xl p-3 max-w-md"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex gap-1.5 mb-2.5">
        {[
          { id: 'all',      label: 'All tenants' },
          { id: 'specific', label: 'Pick specific' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all cursor-pointer min-h-[34px]"
            style={{
              background: mode === m.id ? 'rgba(43,127,255,0.16)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === m.id ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
              color: mode === m.id ? '#80AFFF' : 'var(--text-secondary)',
            }}>{m.label}</button>
        ))}
      </div>
      {mode === 'specific' && (
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {availableTenants.map(t => {
            const selected = picked.includes(t.id)
            return (
              <button key={t.id}
                onClick={() => setPicked(p => selected ? p.filter(x => x !== t.id) : [...p, t.id])}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer min-h-[36px]"
                style={{
                  background: selected ? 'rgba(43,127,255,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
                }}>
                {selected && <Check size={9} style={{ color: '#80AFFF' }} />}
                <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
              </button>
            )
          })}
        </div>
      )}
      <button onClick={() => onConfirm(mode, mode === 'specific' ? picked : [])}
        disabled={mode === 'specific' && picked.length === 0}
        className="w-full text-[11px] font-semibold py-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
        style={{ background: AIMS_GRADIENT, color: '#fff' }}>
        Confirm
      </button>
    </div>
  )
}

function TogglePickerBubble({ onConfirm }) {
  const [tg, setTg] = useState({ truth: true, sandbox: false, sources: true })
  const META = {
    truth:   { label: 'Truth Plane',   color: '#4ade80' },
    sandbox: { label: 'Sandbox Plane', color: '#fbbf24' },
    sources: { label: 'Sources Plane', color: '#60a5fa' },
  }
  return (
    <div className="rounded-xl p-3 max-w-md space-y-2"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      {Object.entries(META).map(([k, m]) => (
        <button key={k} onClick={() => setTg(t => ({ ...t, [k]: !t[k] }))}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer min-h-[40px]"
          style={{
            background: tg[k] ? 'rgba(43,127,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tg[k] ? 'rgba(43,127,255,0.40)' : 'var(--border-subtle)'}`,
          }}>
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
          <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md"
            style={{
              background: tg[k] ? 'rgba(74,222,128,0.16)' : 'rgba(100,116,139,0.16)',
              color: tg[k] ? '#4ade80' : 'var(--text-muted)',
            }}>
            {tg[k] ? 'Active' : 'Inactive'}
          </span>
        </button>
      ))}
      <button onClick={() => onConfirm(tg)}
        className="w-full text-[11px] font-semibold py-2 rounded-lg cursor-pointer min-h-[36px]"
        style={{ background: AIMS_GRADIENT, color: '#fff' }}>
        Confirm
      </button>
    </div>
  )
}

// ── Chat summary card (inline AI bubble at the end of the conversation) ────

function ChatSummaryCard({ data }) {
  const total = data.truth.length + data.sandbox.length + data.sources.length
  const tenantSummary =
    data.scope === 'global'    ? 'Global · all tenants' :
    data.scope === 'workspace' ? (data.tenantMode === 'all'
        ? 'Workspace · all tenants'
        : `Workspace · ${data.tenants.length} tenant${data.tenants.length === 1 ? '' : 's'}`)
    : '—'
  const permLabel =
    data.access.tier === 'workspace'   ? 'Anyone with tenant access' :
    data.access.tier === 'departments' ? 'Specific departments' :
    data.access.tier === 'custom'      ? 'Custom rule' : '—'

  return (
    <div className="rounded-2xl p-4 max-w-[520px]"
      style={{ background: 'rgba(43,127,255,0.04)', border: '1px solid rgba(43,127,255,0.20)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={12} style={{ color: '#80AFFF' }} />
        <p className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-secondary)' }}>Pack summary</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <RecapRow icon={FileText} label="Name"        value={data.name || '—'} />
        <RecapRow icon={FileText} label="Owner"       value={data.owner} />
        {data.description && (
          <div className="col-span-2">
            <RecapRow icon={FileText} label="Description" value={data.description} />
          </div>
        )}
        <RecapRow icon={FileText} label="Department"  value={data.department || 'Cross-departmental'} />
        <RecapRow icon={Database} label="Composition" value={`${total} item${total === 1 ? '' : 's'}`} />
        <RecapRow icon={Lock}     label="Tenant scope" value={tenantSummary} />
        <RecapRow icon={Lock}     label="Permissions"  value={permLabel} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3"
        style={{ borderTop: '1px solid rgba(43,127,255,0.15)' }}>
        <PlaneCount k="truth"   count={data.truth.length}   active={data.toggles.truth} />
        <PlaneCount k="sandbox" count={data.sandbox.length} active={data.toggles.sandbox} />
        <PlaneCount k="sources" count={data.sources.length} active={data.toggles.sources} />
      </div>
    </div>
  )
}

function RecapRow({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide uppercase mb-0.5 flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}>
        <Icon size={10} /> {label}
      </p>
      <p className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function PlaneCount({ k, count, active }) {
  const meta = {
    truth:   { label: 'Truth',   icon: Shield,   color: '#4ade80' },
    sandbox: { label: 'Sandbox', icon: Database, color: '#fbbf24' },
    sources: { label: 'Sources', icon: Folder,   color: '#60a5fa' },
  }[k]
  const Icon = meta.icon
  return (
    <div className="rounded-lg p-2 text-center"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
      <Icon size={11} style={{ color: meta.color }} className="mx-auto mb-0.5" />
      <p className="text-[13px] font-bold tabular-nums" style={{ color: meta.color }}>{count}</p>
      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{meta.label}</p>
      <p className="text-[8px] font-bold tracking-wide uppercase mt-0.5"
        style={{ color: active ? '#4ade80' : 'var(--text-muted)' }}>
        {active ? 'On' : 'Off'}
      </p>
    </div>
  )
}

// ── Confirm dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ title, body, cancel, confirm, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      role="alertdialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'var(--modal-bg, #0b1220)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>{body}</p>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {cancel}
          </button>
          <button onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.40)', color: '#f87171' }}>
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

// D5 — Resume-or-fresh prompt: shown when the Copilot opens and detects a
// non-empty draft from a previous session. Mirrors the ConfirmDialog chrome
// but uses two equal CTAs (no "destructive" framing — neither option is
// wrong). Surfaces what the user was in the middle of so they remember
// before deciding.
function ResumeFreshDialog({ stepNumber, totalSteps, packName, intent, onResume, onFresh }) {
  const intentLabel = intent === 'restrict' ? 'restrict knowledge'
                    : intent === 'add'      ? 'add knowledge'
                    : intent === 'both'     ? 'restrict + add knowledge'
                    : 'configure a new pack'
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      role="alertdialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl p-5"
        style={{ background: 'var(--modal-bg, #0b1220)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'rgba(167,139,250,0.16)', border: '1px solid rgba(167,139,250,0.30)' }}>
            <Sparkles size={13} style={{ color: '#c4b5fd' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Resume your draft?
          </p>
        </div>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          You left mid-conversation on step <strong style={{ color: 'var(--text-primary)' }}>{stepNumber + 1} of {totalSteps}</strong>
          {packName ? <> · pack name <strong style={{ color: 'var(--text-primary)' }}>"{packName}"</strong></> : null}
          {' '}({intentLabel}). Pick up where you left off, or scrap and start over.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={onFresh}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            Start fresh
          </button>
          <button onClick={onResume}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:brightness-110 cursor-pointer"
            style={{ background: AIMS_GRADIENT, color: '#fff' }}>
            Resume draft
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

// Tiny markdown for **bold** only — keeps things controlled.
function renderMarkdown(text = '') {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function loadState() {
  // URL params override storage when the Copilot is launched from another
  // product with workflow context (e.g. Agentic Studio's "Knowledge" button
  // sets intent=restrict & passes the workflow id+name). This guarantees the
  // conversation is anchored to the right context even on a returning session.
  const params = (() => {
    try { return new URLSearchParams(window.location.search) } catch { return null }
  })()
  const urlIntent      = params?.get('intent')
  const urlWorkflowId  = params?.get('workflowId')
  const urlWorkflowName = params?.get('workflowName')
  const fromUrl = (urlWorkflowId || urlWorkflowName)
    ? {
        workflowId:   urlWorkflowId,
        workflowName: urlWorkflowName,
        intent:       ['restrict', 'add', 'both'].includes(urlIntent) ? urlIntent : null,
      }
    : null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.step <= STEPS.length) {
        // Merge URL context on top — workflow ID always takes precedence in
        // case the user navigated from a different workflow than the cached one.
        return fromUrl ? { ...parsed, ...fromUrl } : parsed
      }
    }
  } catch {}

  return fromUrl ? { ...INITIAL_STATE, ...fromUrl } : INITIAL_STATE
}

function buildInitialTranscript() {
  // Empty by design — the parent component fires `askPurpose()` on mount so the
  // first message includes interactive chips with a live handler reference.
  return []
}
