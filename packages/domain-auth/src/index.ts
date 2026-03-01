export interface IngressContext {
  ingressPath?: string;
  hassioTokenPresent: boolean;
}

export function canAutoLoginViaIngress(ctx: IngressContext): boolean {
  return Boolean(ctx.ingressPath && ctx.hassioTokenPresent);
}

export interface WebAuthnConfig {
  rpId: string;
  rpName: string;
  expectedOrigin: string;
}

export function createWebAuthnMock(config: WebAuthnConfig) {
  return {
    generateRegistrationOptions(username: string) {
      return {
        rp: { name: config.rpName, id: config.rpId },
        user: { id: "mock-user-id", name: username, displayName: username },
        challenge: "mock-challenge",
        pubKeyCredParams: [{ type: "public-key" as const, alg: -7 }]
      };
    },
    verifyRegistrationResponse(response: Record<string, unknown>) {
      return { verified: true, credential: { id: response.id, publicKey: "mock-pk" } };
    },
    generateAuthenticationOptions() {
      return { challenge: "mock-challenge", rpId: config.rpId };
    },
    verifyAuthenticationResponse(response: Record<string, unknown>) {
      return { verified: true, expectedOrigin: config.expectedOrigin, credentialId: response.id };
    }
  };
}

