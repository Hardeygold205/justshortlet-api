// @ts-nocheck
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import AppError from "../utils/AppError.js";
import { STATUS_CODES } from "../constants/statusCode.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError("Invalid Google token", STATUS_CODES.UNAUTHORIZED);
    }

    return {
      providerId: payload.sub,
      email: payload.email ? payload.email.toLowerCase() : null,
      firstName: payload.given_name || null,
      lastName: payload.family_name || null,
      avatarUrl: payload.picture || null,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid Google token", STATUS_CODES.UNAUTHORIZED);
  }
};

const appleJwks = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
});

const getAppleSigningKey = (header, callback) => {
  appleJwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

export const verifyAppleToken = (identityToken) =>
  new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getAppleSigningKey,
      {
        algorithms: ["RS256"],
        audience: process.env.APPLE_CLIENT_ID,
        issuer: "https://appleid.apple.com",
      },
      (err, decoded) => {
        if (err) {
          return reject(
            new AppError("Invalid Apple token", STATUS_CODES.UNAUTHORIZED),
          );
        }
        resolve({
          providerId: decoded.sub,
          email: decoded.email ? decoded.email.toLowerCase() : null,
          // Apple only sends the name on the client's FIRST authorization,
          // as separate JSON — not in this token. If you need it, capture
          // it client-side on first sign-in and pass it through separately.
          firstName: null,
          lastName: null,
          avatarUrl: null,
        });
      },
    );
  });
