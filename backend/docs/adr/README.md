# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Horizon-HCM project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

1. **Title**: Short noun phrase
2. **Status**: Proposed, Accepted, Deprecated, Superseded
3. **Context**: What is the issue we're seeing that is motivating this decision?
4. **Decision**: What is the change we're proposing and/or doing?
5. **Consequences**: What becomes easier or more difficult to do because of this change?

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-use-cqrs-pattern.md) | Use CQRS Pattern | Accepted |
| [0002](0002-use-redis-for-caching.md) | Use Redis for Caching | Accepted |
| [0003](0003-use-bullmq-for-jobs.md) | Use BullMQ for Background Jobs | Accepted |
| [0004](0004-use-prisma-orm.md) | Use Prisma ORM | Accepted |
| [0005](0005-use-nestjs-framework.md) | Use NestJS Framework | Accepted |

## Creating a New ADR

1. Copy the template from `0000-template.md`
2. Number it sequentially (next available number)
3. Give it a descriptive title in kebab-case
4. Fill in all sections
5. Submit for review
6. Update this README index

## Resources

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
