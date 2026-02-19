import session from 'express-session';
import { config } from '../config';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

export const sessionMiddleware = session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
});
