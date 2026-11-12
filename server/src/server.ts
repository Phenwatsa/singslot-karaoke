import { app } from './app';
import { getJwtSecret } from './config/jwt';

// Fail fast if JWT_SECRET is not configured in environment
getJwtSecret();

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🎤 SingSlot Server listening on http://${HOST}:${PORT}`);
});
