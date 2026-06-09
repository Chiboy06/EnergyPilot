// convex/auth.config.ts
// Configures Clerk as the Convex authentication provider.
// The JWT template named "convex" must exist in your Clerk dashboard:
//   Clerk Dashboard → JWT Templates → New template → Convex
// The issuer domain must match your Clerk instance domain exactly.

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};