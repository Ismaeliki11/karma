import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface Settings {
    publicNotice: {
        active: boolean;
        message: string;
    };
}

const DEFAULT_SETTINGS: Settings = {
    publicNotice: {
        active: false,
        message: "",
    },
};

const SETTINGS_ID = "1"; // Singleton ID

export async function getSettings(): Promise<Settings> {
    try {
        const result = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).limit(1);

        if (result.length === 0) {
            // No settings in DB, return defaults (and maybe create them if you want, but lazy init is fine)
            return DEFAULT_SETTINGS;
        }

        const row = result[0];
        return {
            publicNotice: {
                active: row.publicNoticeActive,
                message: row.publicNoticeMessage,
            },
        };
    } catch (e) {
        console.error("Error reading settings from DB:", e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(newSettings: Settings): Promise<void> {
    try {
        await db.insert(settings).values({
            id: SETTINGS_ID,
            publicNoticeActive: newSettings.publicNotice.active,
            publicNoticeMessage: newSettings.publicNotice.message,
        }).onConflictDoUpdate({
            target: settings.id,
            set: {
                publicNoticeActive: newSettings.publicNotice.active,
                publicNoticeMessage: newSettings.publicNotice.message,
            },
        });
    } catch (e) {
        console.error("Error saving settings to DB:", e);
        throw e; // Let the caller handle the error
    }
}
