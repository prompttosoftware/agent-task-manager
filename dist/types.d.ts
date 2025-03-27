export declare enum BoardStatusCategory {
    open = "open",
    indeterminate = "indeterminate",
    done = "done"
}
export interface BoardStatus {
    id: string | number;
    name: string;
    category: BoardStatusCategory;
}
export interface Board {
    id: number;
    name: string;
    statuses: BoardStatus[];
}
export interface Issue {
    id: number;
    key: string;
    fields: {
        summary: string;
        status: {
            name: string;
        };
    };
}
