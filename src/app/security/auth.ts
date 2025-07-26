export async function checkAuth(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['resource:508e9158-f400-5dcd-874e-5e8540b212k0', 'resource:508e9158-f400-5dcd-874e-5e8540b212dv'], async (result) => {
            const apiKey = result['resource:508e9158-f400-5dcd-874e-5e8540b212k0'];
            const deviceId = result['resource:508e9158-f400-5dcd-874e-5e8540b212dv'];
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
                resolve(data.status === "wqdfe321#21");
            } catch {
                resolve(false);
            }
        });
    });
} 