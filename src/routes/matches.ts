import { db } from "@/db/db.js"
import { matches } from "@/db/schema.js"
import { getMatchStatus } from "@/utils/match-status.js"
import { createMatchSchema, listMatchesQuerySchema } from "@/validation/matches.js"
import { desc } from "drizzle-orm"
import { Router } from "express"
import type { Request, Response } from "express"



export const matchesRouter: Router = Router()
const MAX_LIMIT = 100

matchesRouter.get("/", async (req: Request, res: Response) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query)


    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.issues })
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT) // Cap the limit to 100


    try {

        const data = await db.select().from(matches).limit(limit).orderBy(desc(matches.createdAt))


        res.json({ data })
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch matches" })
    }
})

matchesRouter.post("/", async (req: Request, res: Response) => {
    const parsed = createMatchSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: parsed.error.issues })
    }

    try {
        const matchData = {
            sport: parsed.data.sport,
            homeTeam: parsed.data.homeTeam,
            awayTeam: parsed.data.awayTeam,
            startTime: new Date(parsed.data.startTime),
            endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
            homeScore: parsed.data.homeScore,
            awayScore: parsed.data.awayScore,
            status: getMatchStatus(parsed.data.startTime, parsed.data.endTime)
        }

        const [event] = await db.insert(matches).values(matchData).returning()

        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event)
        }

        res.status(201).json({ data: event })
    } catch (error) {
        res.status(500).json({ error: "Failed to create match" })
    }
})
