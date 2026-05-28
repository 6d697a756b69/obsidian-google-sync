import { GoogleEvent } from "../types";
import { HttpFn, RetryOptions } from "./http";
import { ApiCall, TokenProvider, apiCall } from "./api";

const BASE = "https://www.googleapis.com/calendar/v3";
const enc = encodeURIComponent;

export interface CalendarListEntry {
    id: string;
    summary?: string;
    primary?: boolean;
}

export interface ListEventsOptions {
    syncToken?: string;
    timeMin?: string;
    timeMax?: string;
    pageSize?: number;
}

export interface ListEventsResult {
    items: GoogleEvent[];
    nextSyncToken?: string;
}

function addQuery(url: string, params: Record<string, string | number | boolean | undefined>): string {
    const query = Object.entries(params)
        .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
        .map(([key, value]) => `${enc(key)}=${enc(String(value))}`)
        .join("&");
    return query ? `${url}?${query}` : url;
}

/** Thin Google Calendar v3 client over an injectable transport. */
export class GoogleCalendarClient {
    constructor(
        private readonly http: HttpFn,
        private readonly getToken: TokenProvider,
        private readonly retry: RetryOptions = {},
    ) {}

    private call(c: ApiCall): Promise<unknown> {
        return apiCall(this.http, this.getToken, this.retry, c);
    }

    async insertEvent(calendarId: string, event: GoogleEvent): Promise<GoogleEvent> {
        return (await this.call({
            method: "POST",
            url: `${BASE}/calendars/${enc(calendarId)}/events`,
            body: event,
        })) as GoogleEvent;
    }

    async patchEvent(
        calendarId: string,
        eventId: string,
        patch: Partial<GoogleEvent>,
    ): Promise<GoogleEvent> {
        return (await this.call({
            method: "PATCH",
            url: `${BASE}/calendars/${enc(calendarId)}/events/${enc(eventId)}`,
            body: patch,
        })) as GoogleEvent;
    }

    async deleteEvent(calendarId: string, eventId: string): Promise<void> {
        await this.call({
            method: "DELETE",
            url: `${BASE}/calendars/${enc(calendarId)}/events/${enc(eventId)}`,
        });
    }

    async listCalendars(): Promise<CalendarListEntry[]> {
        const r = (await this.call({ method: "GET", url: `${BASE}/users/me/calendarList` })) as {
            items?: CalendarListEntry[];
        };
        return r.items ?? [];
    }

    async listEvents(
        calendarId: string,
        options: ListEventsOptions = {},
    ): Promise<ListEventsResult> {
        const items: GoogleEvent[] = [];
        let pageToken: string | undefined;
        let nextSyncToken: string | undefined;

        do {
            const url = addQuery(`${BASE}/calendars/${enc(calendarId)}/events`, {
                singleEvents: true,
                showDeleted: true,
                maxResults: options.pageSize,
                syncToken: options.syncToken,
                timeMin: options.timeMin,
                timeMax: options.timeMax,
                pageToken,
            });
            const r = (await this.call({ method: "GET", url })) as {
                items?: GoogleEvent[];
                nextPageToken?: string;
                nextSyncToken?: string;
            };
            items.push(...(r.items ?? []));
            pageToken = r.nextPageToken;
            nextSyncToken = r.nextSyncToken ?? nextSyncToken;
        } while (pageToken);

        return { items, nextSyncToken };
    }
}
