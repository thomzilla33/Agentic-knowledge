# Handover message

Ready to paste into Slack or send as email. Replace the two dates before sending.

Ownership is recorded here and nowhere else: the Jira tickets are deliberately unassigned, so if this message is not sent, nobody has been told what they own.

---

**UCP handover. I am out from [DATE] and back on [DATE].**

Everything on the Universal Entity Profile is packaged and published. One link has all of it:
https://claude.ai/code/artifact/90c90466-4eed-40ec-88b6-2c1e92370667

Short version: UCP v2.0 — the entity list, and the profile with Overview and Activity — is specified and ticketed. Intelligence and Knowledge are not, and that is the real open work.

**Where things stand**

- 21 tickets under ARP-375, all in the same five-section template Work Queues uses. None are estimated; that is for the team.
- The live prototype is on Vercel, not our GitHub Pages build: https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts. Every ticket links to it and embeds the screenshot of the surface it describes.
- Nothing is assigned in Jira. The ownership below is this message. Assign as you pick things up.

**Lex and JJ: ARP-1408 and its nine children**

Intelligence and Knowledge are a different kind of problem from the other two tabs. Overview and Activity read sources that already exist. These two need something to produce their content first, and the original tree had a ticket for neither. I added the inference engine (ARP-1421) and the claims pipeline (ARP-1422) and widened ARP-1408 to cover them. Without that you would have picked up two tickets you could not close.

Four decisions block the build. Close them before estimating, in this order:

1. **ARP-1424, inference leakage.** The only one that produces a security incident rather than a UX bug if resolved badly: a summary built from a masked field can reveal it without ever displaying it. It changes the engine's architecture, so it goes first.
2. **ARP-1423, is the `Held` state configurable policy or a fixed engine rule.** Decides which ticket builds it. Undecided, it gets built twice or not at all.
3. **ARP-1426, where a claim is promoted to Truth.** Decides whether Knowledge has a write flow at all.
4. **ARP-1425, Sources vs Drives.** One name for one plane. Cheapest of the four.

Start with the brief, which explains why these two tabs are the way they are: https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a

**Needs an answer from whoever owns it**

- **ARP-468 vs ARP-520.** Two breakdowns of the same platform work, 8 and 7 sub-features. One of them is surplus. ARP-520 carries a `{Test}` marker but is the cleaner breakdown of the two, so do not close it without reading its children first.
- **Whoever carried the prototype forward on Vercel.** Why the Knowledge tab says "Drives" while the Overview widget says "Sources" on the same record; whether replacing the per-type assistant label with `Ask about this entity` was deliberate; and where Policies and Assets came from, since they are outside the scope we closed.
- **Michael.** The hide-versus-lock default for types a role cannot read is still undecided. `record-header.tsx` was modified while four `ds/record-header-*` branches were open, so there may be a collision. `Request access` is still a stub: the button exists, the flow does not.

**Blocking estimation**

- **ARP-1416, Notes.** The prototype covers how notes are read, not how they are written. Design needs to define the composer before this can be sized.
- **ARP-1415, Activity.** Do pending tasks sit inside the chronological thread or pinned above it? It is the only open question that changes the design of a mandatory tab.

**Two things not to assume**

- **The Vercel prototype is not ours.** It carries our work, but someone took it considerably further and none of the reasoning is documented. Treat it as a reference for form, not as a source of decisions.
- **P2 on Intelligence and Knowledge means behind v2.0 in order, not in importance.** The `[Next Round]` tag came off precisely so it does not read as backlog.

Everything else — every decision with the argument behind it, all 21 tickets in full, and how to rebuild the prototype on another branch — is in the page above, and as markdown in the repo on branch `claude/ucp-vista-actualizada-431vm5` under `ucp-handoff/`.
