import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

const m2mAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_ISSUER_BASE_URL}.well-known/jwks.json`,
  }) as any,
  audience: process.env.M2M_AUDIENCE,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  algorithms: ["RS256"],
});

export default m2mAuth;
