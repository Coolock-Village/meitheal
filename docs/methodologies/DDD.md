# DDD Guidelines

## Bounded Contexts

- Auth
- Tasks
- Strategy
- Integrations
- Observability

## Language

Use Meitheal terms consistently:

- Villager, Task, Endeavor, Framework, Hearth

## Integration Pattern

- Emit domain events from context boundaries.
- Consume events through integration adapters.
- No direct coupling between contexts through storage internals.
