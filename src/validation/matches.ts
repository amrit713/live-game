import { z } from 'zod'

export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
} as const

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
})

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
})

const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

export const createMatchSchema = z
    .object({
        sport: z.string().min(1),
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
        startTime: z.string().refine((v) => isoRegex.test(v), { message: 'startTime must be a valid ISO 8601 string' }),
        endTime: z.string().refine((v) => isoRegex.test(v), { message: 'endTime must be a valid ISO 8601 string' }),
        homeScore: z.coerce.number().int().nonnegative().optional(),
        awayScore: z.coerce.number().int().nonnegative().optional(),
    })
    .superRefine((data, ctx) => {
        const start = Date.parse(data.startTime)
        const end = Date.parse(data.endTime)
        if (isNaN(start) || isNaN(end)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startTime and endTime must be valid ISO date strings' })
            return
        }
        if (end <= start) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endTime must be after startTime', path: ['endTime'] })
        }
    })

export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>
