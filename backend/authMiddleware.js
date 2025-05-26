import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth header:', authHeader);
    console.log('Token:', token);
    
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'No token provided.' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token verified for user:', user);
        req.user = user;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}
