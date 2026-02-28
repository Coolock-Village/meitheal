/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    ingressPath: string | undefined;
    hassioTokenPresent: boolean;
  }
}
