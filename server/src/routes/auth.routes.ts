import { Router } from 'express';
import { config } from '../config';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.DEMO_PASSWORD) {
    req.session.authenticated = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

authRoutes.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

authRoutes.get('/me', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});
