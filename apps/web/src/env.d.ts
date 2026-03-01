/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    ingressPath: string | undefined;
    hassioTokenPresent: boolean;
    hassUserId: string | undefined;
    hassIsAdmin: boolean;
    timezone: string;
    weekStart: string;
    dateFormat: string;
  }
}
