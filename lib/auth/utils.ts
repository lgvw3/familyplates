import crypto from 'crypto';


export function validateToken(token: string): { userId: number | null } {
    const secret = process.env.SECRET_KEY || 'super-secret-key';
    const [userId, hash] = token.split(':');
  
    const validHash = crypto.createHmac('sha256', secret).update(userId).digest('hex');
    if (hash === validHash) {
        return { userId: parseInt(userId, 10) };
    }
  
    return { userId: null };
}
