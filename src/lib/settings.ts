import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Ensure data dir exists
const ensureDir = () => {
    try {
        const dir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.warn("Could not ensure settings directory (likely read-only fs):", e);
    }
};

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

export async function getSettings(): Promise<Settings> {
    try {
        ensureDir();
        if (!fs.existsSync(SETTINGS_FILE)) {
            // Attempt to create default file, but don't fail if we can't (read-only fs)
            try {
                await saveSettings(DEFAULT_SETTINGS);
            } catch (e) {
                console.warn("Could not save default settings:", e);
                return DEFAULT_SETTINGS;
            }
            return DEFAULT_SETTINGS;
        }
        const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.warn("Error reading settings, using defaults:", e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    ensureDir();
    // This will throw if FS is read-only, caller must handle it or we handle here
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
