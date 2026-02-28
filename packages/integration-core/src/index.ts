export interface DomainEvent<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  requestId: string;
  payload: TPayload;
}

export interface IntegrationPlugin {
  key: string;
  handle(event: DomainEvent): Promise<void>;
}

export class IntegrationBus {
  private readonly plugins: IntegrationPlugin[] = [];

  register(plugin: IntegrationPlugin): void {
    this.plugins.push(plugin);
  }

  async emit(event: DomainEvent): Promise<void> {
    await Promise.all(this.plugins.map((plugin) => plugin.handle(event)));
  }
}
