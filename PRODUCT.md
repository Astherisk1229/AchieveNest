# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students submitting achievement evidence, and authorized staff who later verify and route those submissions.

## Product Purpose

AchieveNest records student achievements through a canonical, evidence-backed lifecycle so students can submit proof, complete trusted fields, and receive an accurate verification or routing status.

## Operating Context

Students use the Student Achievements area to create a draft, upload protected JPEG, PNG, or PDF evidence, wait for security scanning, review transient OCR assistance, manually classify the achievement, and submit it.

## Capabilities and Constraints

- Canonical student achievement records, versions, fields, and evidence are the authority; legacy portfolio endpoints are not used for this workflow.
- OCR is advisory-only and never selects classification or overwrites confirmed values.
- Evidence must be clean before OCR and submission.
- A submission may be routed or remain safely `routing_pending` when no authorized coordinator can be resolved.
- The Student form schema is served by the backend and must not be duplicated in frontend configuration.

## Brand Commitments

AchieveNest uses a restrained Student interface with light surfaces, emerald accents, accessible controls, and plain-language guidance.

## Evidence on Hand

The repository contains canonical lifecycle APIs, a trusted Student form-schema endpoint, and protected representative OCR evidence fixtures.

## Product Principles

- Lead with the student's evidence, not internal form structure.
- Keep student-confirmed values authoritative.
- Reveal only the information required for the selected achievement type.
- Never overstate routing or verification status.

## Accessibility & Inclusion

The web experience requires keyboard-accessible controls, visible focus states, readable feedback, and a responsive single-column mobile layout.
