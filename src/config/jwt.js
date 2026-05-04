/**
 * Single source for JWT secret used when signing and verifying tokens.
 * Production deployments must set JWT_SECRET (e.g. on your cloud provider).
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev-only-insecure-jwt-secret-change-me';
};
