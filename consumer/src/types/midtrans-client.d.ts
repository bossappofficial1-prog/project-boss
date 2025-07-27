// This file tells TypeScript to treat the 'midtrans-client' module
// as having the type 'any', which suppresses the TS7016 error.
// This is a common workaround for JavaScript libraries that don't have
// official TypeScript type definitions.

declare module 'midtrans-client';
