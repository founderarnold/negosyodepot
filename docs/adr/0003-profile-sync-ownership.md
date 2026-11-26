# ADR 0003: Profile synchronization ownership

- Status: Accepted
- Date: 2026-11-26

## Context

Members should not repeatedly encode confirmed information, but uncontrolled replication would weaken consent, correction, deletion, and source ownership.

## Decision

Profile synchronization is user-authorized, field-scoped, purpose-scoped, source-labelled, and server-to-server. FLAME PH remains authoritative for identity and approved member/business profile fields. MarketplacePH remains authoritative for retail catalog fields. NegosyoDepot stores only the fields needed for its capability/application purpose, plus source identifier, source version, consent version, timestamps, and outcome metadata.

Consent is append-only. Each run is auditable without storing raw sensitive values in logs. Conflicts are explicit records; source-owned fields cannot be silently overwritten locally. Revocation stops future synchronization and triggers the approved retention/deletion process without erasing required audit history.

## Consequences

`profile_sync_consents`, `profile_sync_runs`, and `field_sync_conflicts` are the control plane. Browser code cannot run privileged sync. No sync worker is enabled until a source API, scopes, rate limits, correction rules, and deletion propagation are approved.
