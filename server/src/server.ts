import { app } from './app';
import { getJwtSecret } from './config/jwt';

// Fail fast if JWT_SECRET is not configured in environment
getJwtSecret();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🎤 SingSlot Server listening on port ${PORT}`);
});
