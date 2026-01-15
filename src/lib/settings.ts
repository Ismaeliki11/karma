import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Ensure data dir exists
const ensureDir = () => {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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
    ensureDir();
    if (!fs.existsSync(SETTINGS_FILE)) {
        await saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }
    const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    try {
        return JSON.parse(content);
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    ensureDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
