# Task Hierarchy — Decision Brief

Current state: the capability_tasks table and its 2 endpoints are real and now have real UI in KASBA Explorer. But nothing in the system's scoring, gap-analysis, or recommendation logic reads a Task or SubTask — a capability's tasks are stored and browsable, not yet connected to anything downstream.

## Option A — Leave it, wait for ESO

What this means: Tasks stay a real but standalone structure until the ESO contract is signed off. Once it is, "this Task requires these KASBA components at this level" becomes the natural bridge between a capability's task breakdown and an executable workflow.
Cost: Task hierarchy has no functional payoff until ESO unblocks — an unknown timeline, since that's your decision, not a scheduled one.
Benefit: Zero wasted work. Whatever gets built here won't need to be redone once ESO's real shape is decided.

## Option B — Repurpose it now

What this means: Decide on a different real use for the hierarchy today — for example, feeding Task-level detail into the gap-analysis view (so a capability gap shows not just "you're behind on Leadership" but "specifically: these 3 tasks"), independent of ESO.
Cost: Real design work now — deciding what a Task-level gap actually means and computing it, which nothing currently does.
Benefit: Immediate value from data that's currently inert. Doesn't have to wait on the ESO decision.

## What I'd need from you to move on either

Option A: nothing — it's already correctly idle, this brief is just confirming that's a deliberate choice, not an oversight.
Option B: which specific use case you want (gap-analysis granularity is the most natural fit given what already exists) — then it's a real, bounded build, same as everything else this session.
