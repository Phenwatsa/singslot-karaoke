import { app } from './app';
import { getJwtSecret } from './config/jwt';

// Fail fast if JWT_SECRET is not configured in environment
getJwtSecret();

const DEFAULT_PORT = process.env.NODE_ENV === 'production' ? 8080 : 5001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🎤 SingSlot Server listening on http://${HOST}:${PORT}`);
});
