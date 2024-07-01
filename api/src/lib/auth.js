import { randomBytes } from 'crypto';

export default (app) => {
    // Initialize tokens array to store generated tokens
    app.tokens = [];

    /**
     * Middleware to handle authentication based on tokens.
     * This function is called for every request to the server.
     */
    app.use((req, res, next) => {
        try {
            if (!process.env.APPENV || process.env.APPENV !== 'production') return next();

            if (req.originalUrl === '/token') return next();

            if (req.originalUrl.split('/')[1] === 'widgets') return next();

            let token;
            if (req.headers.authorization) {
                token = req.headers.authorization.split('Bearer ')[1];
            } else if (req.query.token) {
                token = req.query.token;
            }

            const valid = token && app.tokens.includes(token);

            if (!token || !valid) {
                return res.status(403).json({
                    error: token ? 'Invalid token' : 'Required token',
                });
            }

            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'An internal server error has occurred.',
            });
        }
    });


    /**
     * Endpoint to generate a new token.
     * 
     * This endpoint requires a password provided in the request body.
     * If the password is correct, a new token is generated and returned to the client.
     */
    app.post('/token', (req, res) => {
        // Check if the password is provided and valid
        const provided = ('password' in req.body);
        const valid = (provided && req.body.password === process.env.API_PASSWORD);

        if (!provided || !valid) {
            return res.status(403).json({
                error: provided ? 'Incorrect password' : 'Required JSON: password',
            });
        }

        // Generate a unique token
        let token = randomBytes(32).toString('hex');
        while (app.tokens.includes(token)) {
            token = randomBytes(32).toString('hex');
        }

        app.tokens.push(token);

        return res.json({ token });
    });
};
