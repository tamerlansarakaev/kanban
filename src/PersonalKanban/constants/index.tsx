import {RecordStatus} from "../enums";

export const COLUMN_WIDTH = 350;
export const COLUMNS_STATUSES = [
    {
        link: "/api/v3/statuses/2",
        status: RecordStatus.Plan
    },
    {
        link: "/api/v3/statuses/7",
        status: RecordStatus.Progress
    },
    {
        link: "/api/v3/statuses/10",
        status: RecordStatus.Inspection
    }
]