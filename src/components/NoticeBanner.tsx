"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export function NoticeBanner() {
    const [notice, setNotice] = useState<{ active: boolean; message: string } | null>(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        fetch("/api/settings/notice")
            .then((res) => res.json())
            .then((data) => {
                if (data.active) {
                    setNotice(data);
                }
            })
            .catch((err) => console.error(err));
    }, []);

    if (!notice || !visible) return null;

    return (
        <div className="bg-black text-white px-4 py-3 relative z-50">
            <div className="max-w-7xl mx-auto flex items-start md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-3 text-sm font-medium flex-1 min-w-0">
                    <Megaphone size={16} className="text-pink-500 shrink-0 mt-0.5 md:mt-0" />
                    <p className="break-words">{notice.message}</p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
