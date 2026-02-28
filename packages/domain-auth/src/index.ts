export interface IngressContext {
  ingressPath?: string;
  hassioTokenPresent: boolean;
}

export function canAutoLoginViaIngress(ctx: IngressContext): boolean {
  return Boolean(ctx.ingressPath && ctx.hassioTokenPresent);
}
