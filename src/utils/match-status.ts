import type { Match } from "@/db/schema.js";
import { MATCH_STATUS } from "@/validation/index.js";


export function getMatchStatus(startTime: string | Date | null, endTime: string | Date | null): typeof MATCH_STATUS[keyof typeof MATCH_STATUS] {

    const now = new Date();
    if (!startTime || !endTime) { return MATCH_STATUS.SCHEDULED; }


    if (now < startTime) {
        return MATCH_STATUS.SCHEDULED;
    } else if (now >= endTime) {
        return MATCH_STATUS.FINISHED
    } else {
        return MATCH_STATUS.LIVE;
    }
}


export async function syncMatchStatuses(match: Match, updateStatus: any) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if (!nextStatus) {
        return match.status;
    }
    if (match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
    return match.status;

}

