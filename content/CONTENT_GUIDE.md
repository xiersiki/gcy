# Content Guide v1

## Scope

This guide defines how to write and review portfolio content in this repo.

## Taxonomy

- Allowed categories: `Web App`, `Case Study`, `Snippet`, `Engineering`
- Tag naming: lower-case kebab-case (`design-system`, `performance`, `content-pipeline`)
- Work types:
  - `demo`: runnable interaction and implementation notes
  - `case-study`: complete project narrative and decisions
  - `snippet`: small reusable code pattern

## Meta Requirements

Each `meta.yml` must include:

- `title`
- `summary`
- `type`
- `date` in `YYYY-MM-DD`
- `tags` (no duplicates)
- `category`

Recommended fields:

- `locale`
- `difficulty`
- `readingTime`
- `featured`
- `cover` or `external.repoUrl`

## MDX Template

Use the same section order for all works:

1. 背景与目标
2. 方案与取舍
3. 实现细节
4. 结果与验证
5. 下一步

### Demo Template

- Describe interaction goal and constraints.
- Explain data/event flow and performance handling.
- Add one reusable code snippet.
- Include measurable outcomes.

### Case-study Template

- Describe business/user context and baseline metrics.
- Detail architecture choices and rejected options.
- Add rollout and risk mitigation notes.
- Provide post-release review.

### Snippet Template

- Define problem boundaries.
- Show compact snippet with usage notes.
- Explain tradeoffs and failure modes.

## Quality Thresholds

- Summary hard limit: at least 20 chars.
- MDX hard limit: at least 180 plain-text chars.
- Soft warnings: summary under 40 chars or MDX under 320 chars.

## Review Checklist

- Content is complete for all 5 sections.
- Tags and category follow taxonomy.
- Links and demo paths are valid.
- Work can be discovered via category and tag pages.
