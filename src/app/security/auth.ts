export async function checkAuth(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get([atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw'), atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')], async (result) => {
            const _0x5a1b = result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')];
            const _0x3c2d = result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')];
            if (!_0x5a1b || !_0x3c2d) {
                resolve(false);
                return;
            }
            try {
                const _0x7f4e = [atob('aHR0cHM6Ly9pdmJzLnNhZHJhdGVjaHMuY29tL3ZlaXdwMzJt'), atob('QXV0aG9yaXphdGlvbg=='), atob('QmVhcmVyIA=='), atob('WC1EZXZpY2UtSUQ=')];
                const _0x2a1f: Record<string, string> = {};
                _0x2a1f[_0x7f4e[1]] = _0x7f4e[2] + _0x5a1b;
                _0x2a1f[_0x7f4e[3]] = _0x3c2d;
                const resp = await fetch(_0x7f4e[0], { headers: _0x2a1f });
                if (!resp.ok) {
                    resolve(false);
                    return;
                }
                const data = await resp.json();
                resolve(data.status === atob('d3FkZmUzMjEjMjE='));
            } catch {
                resolve(false);
            }
        });
    });
} 