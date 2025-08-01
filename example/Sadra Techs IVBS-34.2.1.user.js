// ==UserScript==
// @name         Sadra Techs IVBS
// @namespace    http://tampermonkey.net/
// @version      36.2.0
// @description  Fully automated IVBS script (optimized single file) by Sadra Techs & Murtaza Mohammadi
// @author       murtaza
// @match        https://evisatraveller.mfa.ir/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mfa.ir
// @resource     sounds https://sadra-techs-hub.onrender.com/sound
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js
// @connect      evisatraveller.mfa.ir
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_getExtensionValue
// ==/UserScript==

(async function () {
    'use strict';
    const deviceId = await GM_getExtensionValue('resource:508e9158-f400-5dcd-874e-5e8540b212dv');
    const apiKey = await GM_getExtensionValue('resource:508e9158-f400-5dcd-874e-5e8540b212k0');
    const secret = deviceId + "b" + apiKey;
    const ste = {
        se: "https://ivbs.sadratechs.com",
    };

    function encryptData(data, key) {
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    }

    function decryptData(ciphertext, key) {
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, key);
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch {
            return null;
        }
    }

    async function getFingerprint() {
        const getUserAgent = () => navigator.userAgent;
        const getScreenResolution = () => ({
            width: window.screen.width,
            height: window.screen.height,
        });
        const getColorDepth = () => screen.colorDepth;
        const getDeviceDPI = () => window.devicePixelRatio || 1;
        const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
        const getLanguage = () => navigator.language || navigator.userLanguage;
        const getFontsList = () => {
            const baseFonts = ['monospace', 'sans-serif', 'serif'];
            const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = '72px monospace';
            const fontWidths = baseFonts.map(font => {
                context.font = `72px ${font}`;
                return context.measureText(testString).width;
            });
            return fontWidths;
        };
        const getCanvasFingerprint = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Hello World!', 2, 2);
            return canvas.toDataURL();
        };
        const getWebGLFingerprint = () => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return null;
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
            return { vendor, renderer };
        };

        const getAudioFingerprint = () => {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(10000, context.currentTime);
                oscillator.start(0);
                const analyser = context.createAnalyser();
                oscillator.connect(analyser);
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                oscillator.stop();
                return Array.from(data).slice(0, 10);
            } catch (e) {
                return null;
            }
        };

        const getBrowserAndOS = () => ({
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            os: navigator.oscpu || 'unknown',
        });

        const sha256 = async (str) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        };

        const fingerprint = {
            userAgent: getUserAgent(),
            screenResolution: getScreenResolution(),
            colorDepth: getColorDepth(),
            deviceDPI: getDeviceDPI(),
            timezone: getTimezone(),
            language: getLanguage(),
            fontsList: getFontsList(),
            canvasFingerprint: getCanvasFingerprint(),
            webGLFingerprint: getWebGLFingerprint(),
            audioFingerprint: getAudioFingerprint(),
            browserAndOS: getBrowserAndOS(),
        };
        return sha256(JSON.stringify(fingerprint));
    }

    function changeFavicon(url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
    }

    async function aic(image, state) {
        try {
            const base64data = await readImageAsBase64(image);
            const cleanedBase64 = base64data.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, "");
            const captchaHash = document.querySelector("input[name='captcha_0']").value;
            const captchaCode = document.querySelector("input[name='captcha_1']").value;
            if (!captchaHash) {
                return;
            }

            const newRecord = {
                captchaHash,
                captchaCode,
                image: cleanedBase64,
                isUsed: false,
                createdAt: Date.now()
            };

            await addCaptchaRecord(newRecord);
            startCountdown(state.pre.casrt * 1000, "⏳ Reload Time", state);
            setTimeout(() => {
                window.location.reload();
            }, state.pre.casrt * 1000);
        } catch (e) {
            return null;
        }
    }

    function readImageAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function addCaptchaRecord(data) {
        try {
            const captchaData = {
                key: data.captchaHash,
                value: data.captchaCode,
                image: data.image,
                isUsed: data.isUsed || false,
                isCorrect: false,
                createtime: data.createdAt || Date.now(),
                updatetime: Date.now()
            };

            const result = await dbRequest('create', {
                key: captchaData.key,
                value: captchaData,
                table: 'captcha'
            });

            if (result.data.success) {
                return result;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    const getNewestRecord = async (correct) => {
        try {
            const allCaptchas = await dbRequest('list', {
                table: 'captcha'
            });
            if (allCaptchas.data.success && allCaptchas.data.value && allCaptchas.data.value.length > 0) {
                const unusedCaptchas = allCaptchas.data.value.filter(captcha => !captcha.isUsed);
                if (unusedCaptchas.length > 0) {
                    const sorted = unusedCaptchas.sort((a, b) => b.createtime - a.createtime);
                    if (correct) {
                        return updateAndUse(sorted.filter(item => item.isCorrect)[0]);
                    } else {
                        return updateAndUse(sorted[0]);
                    }
                }
            }

            return null;
        } catch (e) {
            return null;
        }
    };

    async function updateAndUse(newestRecord) {
        if (newestRecord) {
            const updatedRecord = {
                ...newestRecord,
                isUsed: true,
                updatetime: Date.now()
            };

            await dbRequest('update', {
                key: newestRecord.key,
                value: updatedRecord,
                table: 'captcha'
            });

            return {
                captchaHash: newestRecord.key,
                captchaCode: newestRecord.value,
                image: newestRecord.image,
                isUsed: true,
                createdAt: newestRecord.createtime
            };
        }
    }

    function startCountdown(durationInMilliseconds, note = "⏳ Timer", state = { pre: { isAuto: true } }) {
        const existing = document.getElementById("timer");
        if (existing) existing.remove();
        const timer = document.createElement("div");
        timer.id = "timer";
        timer.textContent = "⏳ Starting...";
        Object.assign(timer.style, { position: "fixed", bottom: "0", right: "0", padding: "10px 16px", backgroundColor: "#facc15", color: "#000", fontWeight: "bold", fontSize: "14px", borderTopLeftRadius: "8px", boxShadow: "0 0 5px rgba(0,0,0,0.2)", zIndex: "9999999999" });
        document.body.appendChild(timer);
        const endTime = Date.now() + durationInMilliseconds;
        function updateCountdown() {
            const now = Date.now();
            const remaining = endTime - now;
            if (!state.pre.isAuto) {
                timer.innerHTML = `⏸️ PAUSED - ${note}`;
                return;
            }
            if (remaining > 0) {
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                timer.innerHTML = `⏳ ${timeStr} - ${note}`;
                requestAnimationFrame(updateCountdown);
            } else {
                timer.innerHTML = `✅ DONE - ${note}`;
                setTimeout(() => {
                    timer.style.transition = "opacity 0.5s ease";
                    timer.style.opacity = "0";
                    setTimeout(() => timer.remove(), 600);
                }, 1500);
            }
        }
        updateCountdown();
    }

    function consoc(state, fireBtn, sounds) {
        const wsURL = 'wss://ivbs.sadratechs.com';
        let reconnectTimer;
        const socket = new WebSocket(wsURL);
        state.socket = socket;
        socket.onopen = () => {
            socket.send(JSON.stringify({ api_key: apiKey }));
            fireBtn.className = 'btn btn-primary btn-w-m btn-outline';
            fireBtn.textContent = state.const ? state.const : "🟢 Ready";
            state.requestQueue = [];
            state.isProcessing = false;
            state.connected = true;
            if (state.csrfNochecking) {
                state.csrfNochecking = false;
                let lastCsrfValue = getCookie('csrftoken');
                setInterval(() => {
                    const currentCsrfValue = getCookie('csrftoken');
                    if (currentCsrfValue !== lastCsrfValue) {
                        if (sounds.alarm) new Audio(sounds.alarm).play();
                        document.cookie = `csrftoken=${lastCsrfValue}; path=/; SameSite=Lax`;
                    }
                }, 5000);
                function getCookie(name) {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop().split(';').shift();
                    return null;
                }
            }
        };

        socket.onmessage = async (event) => {
            if (event.data === "blocked") state.blocked = true;
            if (event.data.trim().startsWith("{")) {
                const info = JSON.parse(event.data);
                const currentURL = window.location.href;
                if (currentURL.includes("confirm")) {
                    if (state.pre.congr === info.gr) {
                        enqueueRequest(info, state);
                    } else {
                        if (info.gr === "tele" && state.conftel) {
                            if (info.co.length !== 4 && info.link.split("/")[7].length === 7) {
                                getNewestRecord(false).then(record => {
                                    if (record) {
                                        brodcostwithcap(record, state, info);
                                        writetoinfo(`Sended For Confirm : ${info.link.split("/")[6]} with cap ${record.captchaCode}`);
                                    }
                                })
                            }
                        }
                    }
                } else {
                    if (info.gr === "tele" && state.conftel) {
                        enqueueRequest(info, state);
                    }
                }
            } else {
                if (state.isSubmited) return;

                const combos = {
                    "46111": { agent: "461", visa: "11" },
                    "4911": { agent: "491", visa: "1" }
                };

                const combo = combos[event.data];
                if (!combo) return;

                if (event.data === "4911") {
                    if (sounds.jalal) new Audio(sounds.jalal).play();
                } else if (event.data === "46111") {
                    if (sounds.kabul) new Audio(sounds.kabul).play();
                }

                const visaEl = document.getElementById('id_visa_type');
                const agentEl = document.getElementById('id_issuer_agent');
                const btn = document.getElementById('first_step_submit_btn');

                if (visaEl && agentEl && btn) {
                    visaEl.value = combo.visa;
                    agentEl.value = combo.agent;
                    visaEl.dispatchEvent(new Event('change'));
                    agentEl.dispatchEvent(new Event('change'));

                    btn.click();
                    let clicks = 1;

                    const clickInterval = setInterval(() => {
                        if (clicks < state.pre.recn) {
                            btn.click();
                            clicks++;
                        } else {
                            clearInterval(clickInterval);
                        }
                    }, state.pre.recg);

                    state.isSubmited = true;
                }
            }
        };

        socket.onerror = (er) => {
            fireBtn.className = 'btn btn-warning btn-w-m btn-outline';
            fireBtn.textContent = "⚠️ Error...";
        };

        socket.onclose = (ev) => {
            if (state.autoRecon) {
                fireBtn.className = 'btn btn-secondary btn-w-m btn-outline';
                fireBtn.textContent = "🔄 Reconnecting...";

                clearTimeout(reconnectTimer);
                if (!state.blocked) {
                    reconnectTimer = setTimeout(() => consoc(state, fireBtn, sounds), 5000);
                }
            }
        };
    }

    function writetoinfo(message) {
        const infoPanel = document.getElementById("info-panel");
        const panelTitle = document.createElement("div");
        panelTitle.textContent = message;
        Object.assign(panelTitle.style, { marginTop: "12px", fontWeight: "bold", fontSize: "10px", color: "#1f2937" });
        infoPanel.appendChild(panelTitle);
    }

    function brodcostwithcap(hash, info) {
        const isValid = isex(hash.createdAt);
        if (isValid) {
            GM_xmlhttpRequest({
                method: "POST",
                url: ste.se + "/co3we",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Device-ID': deviceId,
                },
                data: JSON.stringify({
                    link: info.link,
                    cap: hash.captchaHash,
                    code: hash.captchaCode,
                    gr: "tele"
                })
            });
        }
    }

    function enqueueRequest(info, state) {
        if (info.co.length === 4 && info.link.split("/")[7]) {
            state.requestQueue.push(info);
            processQueue(state);
            writetoinfo(`In List : ${info.link.split("/")[6]} with cap ${info.co}`);
        } else if (state.conUser) {
            state.requestQueue.push(info);
            processQueue(state);
            writetoinfo(`In User List : ${info.link.split("/")[6]}`);
        }
    }

    function processQueue(state) {
        if (state.isProcessing) return;
        state.isProcessing = true;
        const interval = setInterval(async () => {
            if (state.requestQueue.length === 0) {
                state.isProcessing = false;
                clearInterval(interval);
                return;
            }

            const info = state.requestQueue.shift();

            if (state.pre.congr === info.gr) {
                const input = document.getElementById("myInput");
                input.value = info.link;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
                document.getElementById("id_captcha_0").value = info.cap;
                document.getElementById("id_captcha_1").value = info.co;
                document.getElementById("first_step_submit").click();
            } else if (info.co.length === 4) {
                const formData = new FormData();
                formData.append('csrfmiddlewaretoken', document.querySelector('input[name="csrfmiddlewaretoken"]').value);
                formData.append('activation_key', info.link.split("/")[7]);
                formData.append('captcha_0', info.cap);
                formData.append('captcha_1', info.co);

                const res = await fetch(info.link, {
                    method: 'POST',
                    body: formData,
                });

                let html = await res.text();
                const win = window.open();
                win.document.open();
                win.document.write(html);
                win.history.pushState({}, '', info.link);
                win.document.close();
            } else {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: info.link,
                    onload: function (res) {
                        let html = res.responseText;
                        const win = window.open();
                        win.document.open();
                        win.document.write(html);
                        win.history.pushState({}, '', info.link);
                        win.document.close();
                    },
                });
            }
        }, state.pre.qwt);
    }

    function dbRequest(op, { key, value, table = 'forms' } = {}) {
        return new Promise((resolve) => {
            function handler(event) {
                window.removeEventListener('extension-db-response', handler);
                resolve(event.detail);
            }
            window.addEventListener('extension-db-response', handler);
            window.dispatchEvent(new CustomEvent('extension-db-request', {
                detail: { op, key, value, table }
            }));
        });
    }

    async function dbList(table = 'forms') {
        const res = await dbRequest('list', { table });
        return res.data.success ? res.data.value : [];
    }

    async function dbUpdate(key, value, table = 'forms') {
        return await dbRequest('update', { key, value, table });
    }

    async function dbDelete(key, table = 'forms') {
        return await dbRequest('delete', { key, table });
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function base64ToBlob(base64) {
        return new Promise((resolve, reject) => {
            try {
                const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                let mimeType = 'image/png';
                if (base64.startsWith('data:image/jpeg')) mimeType = 'image/jpeg';
                else if (base64.startsWith('data:image/png')) mimeType = 'image/png';
                else if (base64.startsWith('data:image/gif')) mimeType = 'image/gif';
                else if (base64.startsWith('data:image/webp')) mimeType = 'image/webp';

                const blob = new Blob([byteArray], { type: mimeType });
                resolve(blob);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function injectBlobAsFile(input, blob, filename = 'upload.png') {
        if (!input || input.tagName !== 'INPUT' || input.type !== 'file') {
            return;
        }
        const file = new File([blob], filename, { type: blob.type });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    }

    async function storePerson(state) {
        const get = id => document.querySelector(id).value || "";
        const person = {
            key: state.filpid || Date.now().toString(),
            name: get('#id_first_name'),
            lastname: get('#id_last_name'),
            fathername: get('#id_father_name'),
            gender: get('#id_gender'),
            birth: get('#id_birth_date'),
            passport: get('#id_passport_number'),
            issue: get('#id_passport_issue_date'),
            expire: get('#id_expire_date'),
            job: get('#id_job'),
            mobile: get('#id_mobile'),
            iranPhone: get('#id_iran_phone_number'),
            address: get('#id_residence_address'),
            iranAddress: get('#id_iran_address'),
            duration: get('#id_duration'),
            entry: get('#id_entry_option'),
            purpose: get('#id_extra_741'),
            arrival: get('#id_extra_751'),
            departure: get('#id_extra_761'),
            order: 0,
            isAuto: false,
            isKabul: false,
            isJalal: false,
            createtime: Date.now(),
            updatetime: Date.now()
        };

        const photo = document.getElementById("id_picture");
        if (photo && photo.files.length > 0) {
            try {
                person.photo = await fileToBase64(photo.files[0]);
            } catch (error) {
                console.error(error);
            }
        }

        const pass = document.getElementById("id_passport_image");
        if (pass && pass.files.length > 0) {
            try {
                person.pass = await fileToBase64(pass.files[0]);
            } catch (error) {
                console.error(error);
            }
        }

        const tsf = document.getElementById("id_extra_country_2231");
        if (tsf && tsf.files.length > 0) {
            try {
                person.tsf = await fileToBase64(tsf.files[0]);
            } catch (error) {
                console.error(error);
            }
        }

        const tsb = document.getElementById("id_extra_1541");
        if (tsb && tsb.files.length > 0) {
            try {
                person.tsb = await fileToBase64(tsb.files[0]);
            } catch (error) {
                console.error(error);
            }
        }

        const update = document.getElementById("id_extra_country_2141");
        if (update && update.files.length > 0) {
            try {
                person.update = await fileToBase64(update.files[0]);
            } catch (error) {
                console.error(error);
            }
        }

        await dbUpdate(person.key, person);
        state.filpid = person.key;
    }

    async function fillPersonById(id, state) {
        const person = id;
        if (!person) return;

        const setValue = (selector, value, triggerChange = false) => {
            const el = document.querySelector(selector);
            if (el) {
                el.value = value;
                if (triggerChange) {
                    el.dispatchEvent(new Event('change'));
                }
            }
        };

        const fields = [
            ['#id_first_name', person.name],
            ['#id_last_name', person.lastname],
            ['#id_father_name', person.fathername],
            ['#id_birth_date', person.birth],
            ['#id_passport_number', person.passport],
            ['#id_passport_issue_date', person.issue],
            ['#id_expire_date', person.expire],
            ['#id_job', person.job],
            ['#id_phone_number', person.mobile],
            ['#id_mobile', person.mobile],
            ['#id_residence_address', person.address],
            ['#id_iran_phone_number', person.iranPhone],
            ['#id_iran_address', person.iranAddress],
            ['#id_extra_741', person.purpose],
            ['#id_extra_751', person.arrival],
            ['#id_extra_761', person.departure],
        ];

        fields.forEach(([selector, value]) => setValue(selector, value));
        setValue('#id_gender', person.gender, true);
        setValue('#id_duration', person.duration, true);
        setValue('#id_entry_option', person.entry, true);
        state.filpid = person.key;

        const injectImageToInput = async (base64, inputSelector, filename) => {
            if (base64) {
                try {
                    const input = document.querySelector(inputSelector);
                    if (input && input.type === 'file') {
                        const blob = await base64ToBlob(base64, filename);
                        await injectBlobAsFile(input, blob, filename);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        };

        await Promise.all([
            injectImageToInput(person.photo, '#id_picture', 'photo.jpeg'),
            injectImageToInput(person.pass, '#id_passport_image', 'passport.jpeg'),
            injectImageToInput(person.tsf, '#id_extra_country_2231', 'tsf.jpeg'),
            injectImageToInput(person.tsb, '#id_extra_1541', 'tsb.jpeg'),
            injectImageToInput(person.update, '#id_extra_country_2141', 'update.jpeg')
        ]);
    }

    async function deletePersonById(state) {
        if (state.filpid) {
            await dbDelete(state.filpid);
        }
    }

    async function renderPersonButtons(state, combo) {
        const rawpersons = await dbList();
        const persons = await rawpersons.sort((a, b) => a.order - b.order);
        const aks = document.getElementById("inSlider");
        if (aks) {
            persons.forEach(p => {
                const btn = document.createElement("button");
                btn.textContent = p.name;
                btn.className = "btn btn-light btn-sm";
                btn.style.margin = "5px";
                btn.onclick = () => fillPersonById(p, state);
                aks.parentNode.insertBefore(btn, aks.nextSibling);
            });
        }
        var autopersons = persons
            .filter(item => item.isAuto === true)
        if (autopersons.length > 0) {
            for (const autopers of autopersons) {
                let conti = false;
                var order = localStorage.getItem('pr');
                order = JSON.parse(order);
                if (!order.includes(autopers.name)) {
                    if (combo === "46111" && autopers.isKabul) {
                        fillPersonById(autopers, state);
                        conti = true;
                    } else if (combo === "4911" && autopers.isJalal) {
                        fillPersonById(autopers, state);
                        conti = true;
                    } else if (combo != "46111" && combo != "4911") {
                        if (!autopers.isKabul && !autopers.isJalal) {
                            fillPersonById(autopers, state);
                            conti = true;
                        }
                    }
                    if (conti) {
                        order.push(autopers.name);
                        localStorage.setItem("pr", JSON.stringify(order));
                        await sncp(null, true);
                        const capvalue = document.getElementById('id_captcha_1').value;
                        if (capvalue.length > 3) {
                            setTimeout(() => {
                                document.getElementById('second_step_submit_btn').click();
                            }, 1000);
                            setTimeout(() => {
                                document.getElementById('final-form-submit').click();
                            }, 2000);
                        } else {
                            await sncp(null, false);
                            setTimeout(() => {
                                document.getElementById('second_step_submit_btn').click();
                            }, 1000);
                            setTimeout(() => {
                                document.getElementById('final-form-submit').click();
                            }, 2000);
                        }
                        break;
                    }
                }
            }

        }
    }

    function createAutoClickButton({
        triggerSelector,
        insertBefore,
        clickCount = 5,
        clickInterval = 500
    }) {
        const triggerBtn = document.querySelector(triggerSelector);
        const insertBtn = document.querySelector(insertBefore);
        if (!triggerBtn) return;

        const autoBtn = document.createElement('button');
        autoBtn.textContent = '🔥 Shoot';
        autoBtn.className = 'btn btn-danger btn-w-m btn-outline';
        autoBtn.style = 'margin: 10px;';
        autoBtn.id = "go";

        insertBtn.parentNode.insertBefore(autoBtn, insertBtn);

        autoBtn.addEventListener('click', () => {
            let clicked = 1;
            if (triggerBtn) triggerBtn.click();
            const interval = setInterval(() => {
                if (clicked < clickCount) {
                    if (triggerBtn) triggerBtn.click();
                    clicked++;
                } else {
                    clearInterval(interval);
                }
            }, clickInterval);
        });
    }

    function fast(state, url, clickBtnId) {
        if (!state.pre.fabt) return;
        const startBtn = document.createElement('button');
        startBtn.id = 'start';
        startBtn.textContent = 'Start Now';
        startBtn.className = 'btn btn-warning btn-w-m btn-outline';
        startBtn.style.margin = '10px';
        if (clickBtnId === "final-form-submit") {
            const finalBtn = document.getElementById('final-form-submit');
            finalBtn.parentNode.insertBefore(startBtn, finalBtn.nextSibling);
        } else {
            const fireBtn = document.getElementById('fire');
            if (!fireBtn) return;
            fireBtn.parentNode.insertBefore(startBtn, fireBtn.nextSibling);
        }

        let tryCount = 0;

        async function handleSubmit() {
            const form = document.getElementById('register_form');
            if (!form) return;
            const formData = new FormData(form);
            const submitUrl = window.location.href.includes("confirm")
                ? (document.getElementById('myInput').value || url)
                : url;
            const btn = document.getElementById("try");
            btn.textContent = `${++tryCount} Sent`;
            try {
                const res = await fetch(submitUrl, {
                    method: 'POST',
                    body: formData,
                });
                const htmladd = `
<script>
(async function() {
    try {
        const res = await fetch('https://ivbs.sadratechs.com/script.js');
        const script = await res.text();
        const el = document.createElement('script');
        el.textContent = script;
        window.gfp = "${state.pre.fp}";
        document.head.appendChild(el);
    } catch (e) {
    }
})();
</script>`;

                if (res.url.includes("confirm") && clickBtnId === "final-form-submit") {
                    startBtn.textContent = 'Got Link';
                    writetoinfo(res.url);
                    clearInterval(state.subint);
                    state.submitting = false;
                    new Notification("New Link", { body: "Check ME" });
                    let html = await res.text();
                    html += htmladd;
                    const win = window.open();
                    win.document.open();
                    win.history.pushState({}, '', res.url);
                    win.document.write(html);
                    win.document.close();
                    window.stop();
                    return;
                }

                if (res.status === 200) {
                    let html = await res.text();
                    html += htmladd;
                    if (!html.includes("error-section--waiting")) {
                        const win = window.open();
                        win.document.open();
                        win.history.pushState({}, '', res.url);
                        win.document.write(html);
                        win.document.close();
                        writetoinfo(`Success`);
                    } else {
                        writetoinfo(`Robot`);
                    }
                } else {
                    writetoinfo(`Recived : ${res.status}`);
                }
            } catch (er) {
                console.log(er);
            }
        }

        function startLoop() {
            const btn = document.getElementById(clickBtnId);
            if (btn) btn.click();

            state.submitting = true;
            state.keepsubmit = 'started';
            tryCount = 0;
            state.subint = setInterval(handleSubmit, state.pre.fsbint);
        }

        function stopLoop() {
            clearInterval(state.subint);
            state.submitting = false;
            state.keepsubmit = 'stoped';
            startBtn.textContent = 'Restart';
            window.stop();
        }

        function restartLoop() {
            state.keepsubmit = 'started';
            state.submitting = true;
            startBtn.textContent = 'Stop';
            tryCount = 0;
            state.subint = setInterval(handleSubmit, state.pre.fsbint);
        }

        startBtn.onclick = () => {
            const current = state.keepsubmit;
            cinpl();
            if (current === 'started') {
                stopLoop();
            } else if (current === 'stoped') {
                restartLoop();
            } else {
                startBtn.textContent = 'Stop';
                startLoop();
            }
        };
    }

    async function sncp(icon, correct) {
        await getNewestRecord(correct).then(record => {
            if (record) {
                injectHash(record, icon);
            }
        }).catch(error => {
            console.error(error);
        });
    }

    const isex = (dateStr) => {
        const created = new Date(dateStr);
        return (Date.now() - created.getTime()) <= 60 * 60 * 1000;
    };

    function injectHash(hash, icon) {
        const isValid = isex(hash.createdAt);
        const captcha0 = document.querySelector('#id_captcha_0');
        const captcha1 = document.querySelector('#id_captcha_1');
        const img = document.querySelector('.ecaptcha');
        const fireBtn = document.getElementById("fire");

        if (!captcha0 || !captcha1 || !img) return;

        if (isValid) {
            captcha0.value = hash.captchaHash;
            captcha1.value = hash.captchaCode;

            const newImg = new Image();
            newImg.src = 'data:image/png;base64,' + hash.image;
            newImg.className = "ecaptcha";
            img.parentNode.replaceChild(newImg, img);

            if (fireBtn && icon) {
                icon.className = 'fa fa-thumbs-up'
                window.stop();
            }
        } else {
            if (fireBtn && icon) {
                icon.className = 'fa fa-exclamation-triangle';
            }
        }
    }

    function cinpl() {
        const panel = document.querySelector('#info-panel');
        if (panel) return;
        const infoPanel = document.createElement("div");
        infoPanel.id = "info-panel";
        Object.assign(infoPanel.style, { position: "fixed", top: "0", left: "0", height: "50vh", width: "200px", padding: "16px", backgroundColor: "#f3f4f6", color: "#111827", borderRight: "1px solid #d1d5db", boxShadow: "2px 0 5px rgba(0,0,0,0.05)", zIndex: "9999999999", overflowY: "auto", maxHeight: "90vh" });
        document.body.appendChild(infoPanel);
        const infocontrol = document.createElement("div");
        infocontrol.id = "cont-panel";
        infoPanel.appendChild(infocontrol);
        const span = document.createElement('span');
        span.id = "try";
        span.textContent = 'Tried : 0';
        span.style.fontWeight = 'bold';
        span.style.textAlign = "center";
        span.style.display = "block";
        span.style.padding = "5px"
        infocontrol.appendChild(span);
    }

    function fbt(form, state, page, sounds) {
        if (document.getElementById("fire")) return;

        const btn = document.createElement("button");
        btn.id = "fire";
        btn.textContent = "Manual";
        btn.className = "btn btn-success btn-w-m btn-outline";
        btn.style = "margin:10px;";
        form.parentNode.insertBefore(btn, form.nextSibling);

        btn.onclick = () => {
            const isAuto = state.pre.isAuto;

            if (isAuto) {
                state.pre.isAuto = false;

                if (page === "confirm" && state.pre.hlc) {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.id = "myInput";
                    input.className = "form-control";
                    input.style = "margin:10px;width:500px";
                    input.onchange = () => {
                        const url = input.value;
                        const code = url.split("/")[7] || "";
                        document.getElementById("register_form").action = url;
                        document.getElementById("id_activation_key").value = code;
                    };
                    form.parentNode.insertBefore(input, btn.nextSibling);
                }

                if (page === "first") {
                    btn.textContent = "Start Waiting";
                    window.stop();
                } else if (page === "confirm") {
                    btn.textContent = "Start Confirming";
                    window.stop();
                }
            } else {
                if (state.connected) {
                    state.socket.close();
                    state.autoRecon = false;
                    state.connected = false;
                    btn.textContent = "Disconnected";
                } else {
                    if (state.pre.telconf) {
                        cinpl();
                        const infoPanel = document.querySelector('#cont-panel');
                        const conf = document.createElement('input');
                        conf.type = 'checkbox';
                        conf.id = 'confirm-Tel';
                        Object.assign(conf.style, {
                            width: '18px',
                            height: '18px',
                            marginRight: '8px',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                        });
                        const conflab = document.createElement('label');
                        conflab.htmlFor = 'confirm-Tel';
                        conflab.innerText = 'Confirm Telegram';
                        Object.assign(conflab.style, {
                            marginRight: '15px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            userSelect: 'none',
                        });
                        infoPanel.appendChild(conf);
                        infoPanel.appendChild(conflab);
                        conf.addEventListener('change', () => {
                            state.conftel = conf.checked;
                        });
                        const confUser = document.createElement('input');
                        confUser.type = 'checkbox';
                        confUser.id = 'confirm-user';
                        Object.assign(confUser.style, {
                            width: '18px',
                            height: '18px',
                            marginRight: '8px',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                        });
                        const confUserlab = document.createElement('label');
                        confUserlab.htmlFor = 'confirm-user';
                        confUserlab.innerText = 'Confirm With User';
                        Object.assign(confUserlab.style, {
                            marginRight: '15px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            userSelect: 'none',
                        });
                        infoPanel.appendChild(confUser);
                        infoPanel.appendChild(confUserlab);
                        confUser.addEventListener('change', () => {
                            state.conUser = confUser.checked;
                        });
                    }
                    state.autoRecon = true;
                    consoc(state, btn, sounds);
                }
            }
        };
    }

    async function pchi(image, state) {
        const isStatus = !!document.querySelector('#id_track_code');
        if (isStatus) {
            state.pre.isAuto = true;
            startCountdown(state.pre.cassw * 1000, "⏳ Solve Time", state);
            setTimeout(() => {
                aic(image, state);
            }, state.pre.cassw * 1000);
        }
        if (!state.pre.sch || state.isSolved || state.solving) return;

        state.solving = true;

        const formData = new FormData();
        formData.append('image', image, 'image.png');
        formData.append('fp', state.pre.fp);

        GM_xmlhttpRequest({
            method: "POST",
            url: ste.se + "/g2cd",
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Device-ID': deviceId,
            },
            data: formData,
            onload: function (response) {
                state.solving = false;
                try {
                    const res = JSON.parse(response.responseText);
                    const code = res.code;
                    const input = document.querySelector('#id_captcha_1');
                    if (input && code) {
                        input.value = code;
                        if (code.length >= 4) {
                            state.isSolved = true;
                        }
                    }
                } catch (er) {
                    console.log(er);
                }
            },
            onerror: function () {
                state.solving = false;
            }
        });

        const reader = new FileReader();
        reader.onloadend = function () {
            const base64data = reader.result;
            const oldImg = document.querySelector('.ecaptcha');
            if (!oldImg) return;

            const newImg = new Image();
            newImg.src = base64data;
            newImg.className = 'ecaptcha';
            oldImg.parentNode.replaceChild(newImg, oldImg);
        };
        reader.readAsDataURL(image);
    }

    async function gchc(state) {
        const img = document.querySelector('.ecaptcha');
        if (!img) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
            if (blob) {
                state.capok = true;
                await pchi(blob, state);
            } else {
                const src = img.getAttribute('src');
                if (src && src.includes('ecaptcha')) {
                    try {
                        const response = await fetch(`https://evisatraveller.mfa.ir${src}`);
                        if (response.ok && response.headers.get('content-type') === 'image/png') {
                            const arrayBuffer = await response.arrayBuffer();
                            const imageBlob = new Blob([arrayBuffer], { type: 'image/png' });
                            state.capok = true;
                            await pchi(imageBlob, state);
                            window.stop();
                        }
                    } catch (er) {
                        console.log(er)
                    }
                }
            }
        }, 'image/png');
    }

    async function confirmPageLogic(form, state) {
        form.setAttribute("target", "_blank");
        state.pre.isAuto = true;
        const submitBtnId = 'first_step_submit';
        const submitBtn = document.getElementById(submitBtnId);
        fbt(form, state, 'confirm');
        const fireBtn = document.getElementById('fire');
        fast(state, 'conf', submitBtnId);
        setInterval(() => {
            const btn = document.getElementById(submitBtnId);
            if (btn) btn.disabled = false;
        }, 3000);
        if (!submitBtn || !fireBtn) return;

        if (state.pre.issh) {
            createAutoClickButton({
                triggerSelector: '#first_step_submit',
                insertBefore: "#fire",
                buttonId: 'go',
                buttonText: '🔥 Shoot',
                clickCount: state.pre.cnsin,
                clickInterval: state.pre.cnsig
            });
        }

        const cost = document.createElement('button');
        cost.id = 'cost';
        cost.textContent = 'Send To All';
        cost.className = 'btn btn-info btn-w-m btn-outline';
        cost.style.margin = '10px';
        fireBtn.insertAdjacentElement('afterend', cost);
        cost.addEventListener('click', () => {
            cost.disabled = true;
            setTimeout(() => {
                cost.disabled = false;
            }, 10000);
            GM_xmlhttpRequest({
                method: "POST",
                url: ste.se + "/co3we",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Device-ID': deviceId,
                },
                data: JSON.stringify({
                    link: document.getElementById("myInput").value,
                    cap: document.getElementById("id_captcha_0").value,
                    code: document.getElementById("id_captcha_1").value,
                    gr: state.pre.congr
                })
            });
        });
    }

    function secondPageLogic(state, form, combo) {
        const emailInput = document.getElementById('id_email');
        const captchaInput = document.getElementById('id_captcha_0');
        const finalBtn = document.getElementById('final-form-submit');
        form.setAttribute("target", "_blank");

        if (!emailInput || !captchaInput || !finalBtn) return;

        setInterval(() => {
            emailInput.value = state.pre.email;
        }, 2000);

        setInterval(() => {
            finalBtn.disabled = false;
        }, 3000);

        captchaInput.addEventListener('paste', e => {
            captchaInput.value = e.clipboardData.getData('text');
            e.preventDefault();
        });

        if (state.pre.issh) {
            createAutoClickButton({
                triggerSelector: '#final-form-submit',
                insertBefore: "#final-form-submit",
                buttonId: 'go',
                buttonText: '🔥 Shoot',
                clickCount: state.pre.snfps,
                clickInterval: state.pre.snfpsg
            });
        }

        fast(state, "https://evisatraveller.mfa.ir/en/request/applyrequest/#", "final-form-submit");

        const autofillSection = async () => {
            const aks = document.getElementById("inSlider");
            if (aks) {
                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Save & Update";
                saveBtn.className = "btn btn-info btn-sm";
                saveBtn.style.margin = "5px";
                saveBtn.onclick = () => storePerson(state);
                aks.parentNode.insertBefore(saveBtn, aks.nextSibling);
                await renderPersonButtons(state, combo);
            }
        };
        autofillSection();
    }

    async function firstPageLogic(form, state, sounds) {
        state.pre.isAuto = true;
        form.setAttribute("target", "_blank");
        startCountdown(state.pre.smawt * 1000, "⏳ Submit Time", state);
        state.csrfNochecking = true;
        if (sounds.outofcapacity) new Audio(sounds.outofcapacity).play();
        setTimeout(() => {
            const sbtn = document.querySelector('#first_step_submit_btn');
            if (sbtn && state.pre.isAuto) {
                sbtn.click();
                if (state.pre.smact > 0) {
                    startCountdown(state.pre.smact * 1000, "⏳ To Close Tab", state);
                    setTimeout(() => {
                        if (state.pre.isAuto) {
                            window.close();
                        }
                    }, state.pre.smact * 1000);
                }
            }
        }, state.pre.smawt * 1000);

        const selectElement = document.getElementById("id_issuer_agent");
        if (selectElement) {
            const existingValues = Array.from(selectElement.options).map(opt => opt.value);
            if (!existingValues.includes("461")) {
                const kab = new Option("KABUL", "461");
                const jal = new Option("JALAL ABAD", "491");
                selectElement.add(kab);
                selectElement.add(jal);
            }
            const setValue = (selector, value, triggerChange = false) => {
                const el = document.querySelector(selector);
                if (el) {
                    el.value = value;
                    if (triggerChange) {
                        el.dispatchEvent(new Event('change'));
                    }
                }
            };

            const aks = document.getElementById("inSlider");
            const btns = [{ agn: "Kabul", "type": "11", co: "461" }, { agn: "Jalal", "type": "1", co: "491" }]
            for (const ag of btns) {
                const btn = document.createElement("button");
                btn.textContent = ag.agn;
                btn.className = "btn btn-info btn-sm";
                btn.style.margin = "5px";
                btn.onclick = () => {
                    setValue('#id_visa_type', ag.type, true);
                    setValue('#id_nationality', "21", true);
                    setValue('#id_passport_type', "1", true);
                    setValue('#id_issuer_agent', ag.co, true);
                };
                aks.parentNode.insertBefore(btn, aks.nextSibling);
            }
            const btn = document.createElement("button");
            btn.textContent = "Reset";
            btn.className = "btn btn-danger btn-sm";
            btn.style.margin = "5px";
            btn.onclick = async () => {
                localStorage.setItem('pr', "[]");
                const cookieval = await GM_getExtensionValue('cookie');
                if (cookieval) {
                    let baseCookies = document.cookie;
                    let allCookies = (baseCookies ? baseCookies + "; sessionid=" : "") + cookieval;
                    let url = window.location.href;
                    GM_xmlhttpRequest({
                        method: "GET",
                        url,
                        headers: {
                            "Cookie": allCookies
                        },
                        binary: true,
                        onload: function (res) {
                            const win = window.open();
                            win.document.open();
                            win.history.pushState({}, '', res.url);
                            win.document.write(res.responseText);
                            win.document.close();
                        },
                        onerror: function (err) {
                            console.log(err);
                        }
                    });
                }
            };
            aks.parentNode.insertBefore(btn, aks.nextSibling);
        }

        fbt(form, state, 'first', sounds);
        if (state.pre.issh) {
            createAutoClickButton({
                triggerSelector: '#first_step_submit_btn',
                insertBefore: '#fire',
                buttonId: 'go',
                buttonText: '🔥 Shoot',
                clickCount: state.pre.shsin,
                clickInterval: state.pre.shsig
            });
        }
        fast(state, "https://evisatraveller.mfa.ir/en/request/applyrequest/", "first_step_submit_btn");
    }

    function logics(state, sounds, form, combo) {
        const isSecond = !!document.querySelector('#id_first_name');
        const isConfirm = !!document.querySelector('#id_activation_key');
        const isFirst = !!document.querySelector('#id_visa_type');
        const img = document.querySelector('.ecaptcha');

        if (img) {
            var link = document.createElement('a');
            link.href = "https://evisatraveller.mfa.ir" + img.getAttribute('src');
            link.target = '_blank';
            link.textContent = " OPEN";
            img.parentNode.insertBefore(link, img.nextSibling);
            var cap = document.createElement('a');
            cap.href = "#void";
            cap.id = "cap";
            img.parentNode.insertBefore(cap, img.nextSibling);
            const icon = document.createElement('i');
            icon.className = 'fa fa-image';
            icon.style.margin = '5px';
            cap.appendChild(icon);

            cap.addEventListener('click', function () {
                sncp(icon, false);
            });
            var jscap = document.createElement('a');
            jscap.href = "#void";
            jscap.id = "jscop"
            img.parentNode.insertBefore(jscap, img.nextSibling);
            const jsicon = document.createElement('i');
            jsicon.className = 'fa fa-code';
            jsicon.style.margin = '5px';
            jscap.appendChild(jsicon);

            jscap.addEventListener('click', function () {
                sncp(jsicon, true);
            });
            var inputElement = document.querySelector('#id_captcha_0');
            inputElement.type = "text";
            const intervalId = setInterval(() => {
                if (!state.capok) {
                    gchc(state);
                } else {
                    clearInterval(intervalId);
                }
            }, state.pre.gcit);
        }

        if (isSecond) {
            fast(state);
            secondPageLogic(state, form, combo);
        } else if (isConfirm) {
            if (sounds.outofcapacity) new Audio(sounds.newLink).play();
            confirmPageLogic(form, state, sounds);
        } else if (isFirst) {
            firstPageLogic(form, state, sounds)
        }
    }

    async function str(state) {
        const sounds = JSON.parse(GM_getResourceText('sounds') || '{}');
        const form = document.querySelector('#register_form');
        const firstNameInput = document.querySelector('#id_first_name');
        const currentURL = window.location.href;
        var combo = "";

        if (firstNameInput) {
            const vts = document.getElementById("id_visa_type");
            const ags = document.getElementById("id_issuer_agent_id");
            const vtns = vts.options[vts.selectedIndex].value || '';
            const agvs = ags.value || '';
            combo = agvs + vtns;

            if (sounds.submitrequest) new Audio(sounds.submitrequest).play();

            const alertBox = document.querySelector(".alert-dismissable");
            const modalTitle = document.querySelector(".modal-title");
            const color = (combo === "46111" || combo === "4911") ? "green" : "red";
            if (alertBox) alertBox.style.backgroundColor = color;
            if (modalTitle) modalTitle.style.backgroundColor = color;

            GM_xmlhttpRequest({
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Device-ID': deviceId,
                },
                url: `${ste.se}/repo?ste=SecondStep&ag=${agvs}&vt=${vtns}&user=${state.user}`,
            });

            changeFavicon('https://img.icons8.com/?size=16&id=nU3xgaV2IKwS&format=png&color=000000?v=temporary');
        }

        else if (currentURL.includes("confirm")) {
            const parts = currentURL.split("/");
            const info = `${parts[6] || ''}|${parts[7] || ''}`;
            GM_xmlhttpRequest({
                method: "GET",
                url: `${ste.se}/repo?state=Confirm&user=${state.user}&info=${info}`,
            });
            changeFavicon('https://img.icons8.com/?size=16&id=DFU1kReSUccu&format=png&color=000000?v=temporary');
            const cookieval = await GM_getExtensionValue('cookie');
            if (cookieval) {
                let baseCookies = document.cookie;
                let allCookies = (baseCookies ? baseCookies + "; sessionid=" : "") + cookieval;
                let url = window.location.href;
                state.pre.autrl = false;
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    headers: {
                        "Cookie": allCookies
                    },
                    binary: true,
                    onload: function (res) {
                        const win = window.open();
                        win.document.open();
                        win.history.pushState({}, '', res.url);
                        win.document.write(res.responseText);
                        win.document.close();
                        state.pre.autrl = true;
                    },
                    onerror: function (err) {
                        console.log(err);
                    }
                });
            }
        }

        if (form) {
            logics(state, sounds, form, combo);
        }

        else if (currentURL.includes("ecaptcha")) {
            setTimeout(() => {
                const imgLoaded = document.querySelector(`img[src="${currentURL}"]`);
                const redirectElement = document.querySelector('.error-section--waiting');
                if (!imgLoaded && !redirectElement) {
                    window.location.reload();
                }
            }, 1000);
        }

        else {
            const success = document.querySelector('#printable-area');
            const fail = document.querySelector('#go_to_track');

            if (success || fail) {
                const confirmInfo = currentURL.split("confirm")[1] || '';
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `${ste.se}/repo?ste=Success&info=${confirmInfo}&user=${state.user}`,
                });
            } else {
                const redirectElement = document.querySelector('.error-section--waiting');
                if (!redirectElement) {
                    setTimeout(() => {
                        if (state.user && state.pre.autrl) {
                            window.location.reload();
                        }
                    }, 500);
                }
            }
        }
    }

    async function askServer(fp, lat, lon) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `${ste.se}/veiwp32m?fp=${fp}&lat=${lat}&lot=${lon}`,
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${apiKey}`,
                'X-Device-ID': deviceId,
            },
            onload: (response) => {
                let res;
                try {
                    res = JSON.parse(response.responseText);
                } catch (e) {
                    console.log(e);
                }

                switch (res.status) {
                    case "wqdfe321#21":
                        res.timestamp = new Date().toISOString();
                        res.pre.fp = fp;
                        var encryptedData = encryptData(res, secret);
                        localStorage.setItem('log', encryptedData);
                        str(res);
                        break;

                    case "expsin!15":
                        alert(res.message);
                        document.body.innerHTML = "";
                        break;

                    default:
                        alert("Connection Error");
                        document.body.innerHTML = "";
                }
            }
        });
    }

    getFingerprint().then(fp => {
        const encrypted = localStorage.getItem('log');
        if (navigator.geolocation) {
            if (encrypted) {
                const decrypted = decryptData(encrypted, secret);
                const storedTime = new Date(decrypted.timestamp);
                const now = new Date();
                const diff = (now - storedTime) / (1000 * 60);
                if (decrypted.pre.fp === fp && diff < 20) {
                    str(decrypted);
                } else {
                    navigator.geolocation.getCurrentPosition(pos => {
                        askServer(fp, pos.coords.latitude, pos.coords.longitude);
                    });
                }
            } else {
                navigator.geolocation.getCurrentPosition(pos => {
                    askServer(fp, pos.coords.latitude, pos.coords.longitude);
                });
            }
        } else {
            console.log('Please turn on the location');
        }
    });
})();
