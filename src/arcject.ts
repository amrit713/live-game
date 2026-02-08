import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import type { NextFunction, Request, Response } from "express";


const arcjectKey = process.env.ARCJET_KEY;
const arcjectMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjectKey) {
    throw new Error('Environment variable ARCJET_KEY is not set');
}

export const httpArcjet = arcjectKey ? arcjet({
    key: arcjectKey,
    rules: [
        shield({ mode: arcjectMode }),
        detectBot({ mode: arcjectMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
        slidingWindow({ mode: arcjectMode, interval: "10s", max: 50 })

    ]
}) : null;

export const wsArcjet = arcjectKey ? arcjet({
    key: arcjectKey,
    rules: [
        shield({ mode: arcjectMode }),
        detectBot({ mode: arcjectMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
        slidingWindow({ mode: arcjectMode, interval: "2s", max: 5 })

    ]
}) : null;


export function securityMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!httpArcjet) {
            return next();
        }
        try {

            const decision = await httpArcjet.protect(req);
            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'too many requests' });
                }
                return res.status(403).json({ error: 'forbidden' });
            }

        } catch (error) {
            console.error('Error in Arcjet middleware:', error);
            return res.status(503).json({ error: 'service unavailable' });
        }

        next();
    }

}
