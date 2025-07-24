export async function checkAuth(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['__cat_api_key', '__cat_bg_color'], async (result) => {
            const apiKey = result.__cat_api_key;
            const deviceId = result.__cat_bg_color;
            if (!apiKey || !deviceId) {
                resolve(false);
                return;
            }
            try {
                const resp = await fetch('https://ivbs.sadratechs.com/veiwp32m', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Device-ID': deviceId,
                    },
                });
                if (!resp.ok) {
                    resolve(false);
                    return;
                }
                const data = await resp.json();
                console.log(data);
                resolve(data.status === "wqdfe321#21");
            } catch {
                resolve(false);
            }
        });
    });
} 