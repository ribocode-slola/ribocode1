# ADR-0001: Alignment Quality Gates and Ownership Split

- Status: Accepted
- Date: 2026-10-13
- Decision Makers: Ribocode maintainers

## Context

Ribocode alignment behavior is implemented across two layers:

- Application orchestration in src/App.tsx
- Geometry/fitting methods in packages/molstar

Recent benchmark work established one strong reference case and one weak case:

- Strong case: 6XU6.cif -> 6XU8.cif, chain CU -> CU
- Weak case: 7WTT.cif -> 7WTZ.cif, chain e -> e

The fit already includes rigid-body rotation and translation. Experiments showed that adding post-fit translation-only behavior is not a reliable fix for weak correspondence cases.

## Decision

1. Use benchmark-driven quality gates for alignment changes.
2. Treat correspondence quality as the primary improvement target for weak cases.
3. Keep implementation ownership split explicit:
   - App-level behavior/contracts documented in project docs.
   - Geometry-method behavior documented near molstar geometry implementation.

## Quality Gates

Any alignment algorithm change must satisfy all of the following:

1. No regression in strong-case benchmark behavior (6XU6/6XU8 CU -> CU).
2. Material improvement target for weak-case benchmark behavior (7WTT/7WTZ e -> e), or a documented reason if deferred.
3. Unit and E2E checks pass, including alignment metric tests.
4. In-place and fallback paths are both validated when App.tsx realignment logic changes.

## Required Automated Checks

Run at minimum:

- npm test -- src/utils/alignmentGeometry.test.ts src/utils/realignment.test.ts src/App.test.tsx
- npm test -- src/utils/alignmentPerformance.test.ts
- npx playwright test e2e/sync-and-realign-camera.e2e.spec.ts
- npx playwright test e2e/alignment-performance-cu-6xu6-6xu8.e2e.spec.ts
- npx playwright test e2e/alignment-diagnostic-e-7wtt-7wtz.e2e.spec.ts

## Follow-up Work

1. Investigate residue-correspondence-aware pairing in chain alignment for weak cases.
2. Expand explicit automated coverage for residue-based chain correspondence behavior.
3. Keep benchmark metrics in release notes when alignment internals change.

## Consequences

- Alignment changes become easier to review objectively.
- Risk of repeating unstable experiments is reduced.
- Work remains traceable despite split ownership between App and customized Mol* code.
