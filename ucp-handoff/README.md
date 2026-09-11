# UCP - Complete handover

**Author:** Thomas Gonzalez. **Date:** 2026-09-11. **Reason:** vacation; the team continues without me.

This package holds everything needed to pick the Universal Entity Profile up where it was left: what is built, where it lives, why each decision was made the way it was, which tickets exist in Jira, and what is still open.

**To share with the team:** [the complete handover as a single page](https://claude.ai/code/artifact/90c90466-4eed-40ec-88b6-2c1e92370667) - the whole package in one document, no repository access needed. The same content is [`UCP-HANDOVER-COMPLETE.md`](UCP-HANDOVER-COMPLETE.md) in this folder.

---

## The first thing to know

**The live prototype is not our GitHub Pages build.** It is deployed on Vercel and someone carried it further than our branch:

> https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts

All 21 Jira tickets point there as their Prototype Link, and each one also embeds the screenshot that shows it. Our Pages build stays as a historical record of where this started, not as a build reference. What changed is detailed in [`01-STATE.md`](01-STATE.md).

---

## Index

| Document | What it holds | For whom |
|---|---|---|
| [`01-STATE.md`](01-STATE.md) | Where everything is today: prototypes, repos, branches, Jira. What is real and what is mocked. The two unresolved inconsistencies. | Everyone - start here |
| [`02-DECISIONS.md`](02-DECISIONS.md) | Every product decision with its reason. Including the ones that were reversed, and why. | PM and design |
| [`03-TICKETS.md`](03-TICKETS.md) | The 21 tickets, with their Jira key, their level in the hierarchy and why each one exists. | Engineering and PM |
| [`04-EDGARDO-REVIEW.md`](04-EDGARDO-REVIEW.md) | Edgardo Sierra's review: 40 observations, of which **exactly one** changed anything in the UCP. Includes why three that looked like they applied do not. | PM |
| [`05-REPLICATION.md`](05-REPLICATION.md) | How to rebuild the prototype from scratch on another branch: repo, patches, build, deploy, the design system rules you will run into, and how to capture fresh screenshots. | Engineering and design |
| [`06-OPEN-ITEMS.md`](06-OPEN-ITEMS.md) | What is still open, with the name of whoever can close it. | Whoever takes over |
| [`07-TICKETS-FOR-DELIVERY.md`](07-TICKETS-FOR-DELIVERY.md) | **The delivery pack.** All 21 tickets in full, in the same template Work Queues uses, each with its prototype link and screenshot. This is the file to hand to JJ and Lex. | Engineering |
| [`UCP-HANDOVER-COMPLETE.md`](UCP-HANDOVER-COMPLETE.md) | **Everything in one file.** All seven documents merged, with a table of contents. This is the single file to share or to hand to someone who wants the whole thing in one read. | Everyone |
| [`HANDOVER-MESSAGE.md`](HANDOVER-MESSAGE.md) | **The message to send.** Ready to paste into Slack or email: the links, who owns what, what is blocked and who unblocks it. The Jira tickets are unassigned on purpose, so this note is the only record of ownership. | Thomas, before leaving |
| [`REPLICATION-PROMPT.md`](REPLICATION-PROMPT.md) | The prompt to run this whole exercise again for another module: the method, plus the environment gotchas that cost the most time the first time. | Whoever packages the next feature |
| `screenshots/` | Seven captures from the live prototype, referenced by every ticket. | Everyone |

---

## Five-line summary

1. The UCP has four fixed tabs - **Overview, Activity, Intelligence, Knowledge** - plus industry modules at the end. That is a platform contract, not a screen.
2. Today's delivery (**UCP v2.0**) covers Contacts, Employees and Companies: the list, pagination, creation via stepper, and the two mandatory tabs.
3. **Intelligence and Knowledge are the real open work**, and they belong to **Lex Paniagua and Julian Johnston**. Unlike Overview and Activity, they have nothing to read from: they need an inference engine and a claims pipeline that did not exist in the tree. See the [dedicated brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a).
4. There are **21 tickets** in Jira under Boulder **ARP-375**, none estimated. All 21 descriptions follow the same five-section template Work Queues uses.
5. **One question is open for the team** - which of ARP-468 or ARP-520 is live - along with four decisions that block Intelligence and Knowledge. They are in [`06-OPEN-ITEMS.md`](06-OPEN-ITEMS.md).
