// ==UserScript==
// @name         Auto-save
// @namespace    http://argavyon.github.io/
// @version      1.1.1
// @description  try to take over the world!
// @author       Argavyon
// @match        https://pmotschmann.github.io/Evolve/
// @match        https://pmotschmann.github.io/Evolve/?*
// @icon         https://pmotschmann.github.io/Evolve/evolved.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// ==/UserScript==

const promiseDbxCloud = import('https://cdn.jsdelivr.net/gh/Argavyon/Cloud-API-with-Dropbox@v2.0/DropboxCloud.esm.js');
const CLIENT_ID = 'v0o2yze7wrd6p4i';

async function waitFor(selectors) {
    const { promise, resolve } = Promise.withResolvers();

    const elem = document.querySelector(selectors);
    if (elem) {
        return elem;
    }

    const observer = new MutationObserver( () => {
        const elem = document.querySelector(selectors);
        if (elem) {
            observer.disconnect();
            resolve(elem);
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    return promise;
}

function makeToggle(label, checked, onStateChange) {
    const toggle = document.createElement('label');
    toggle.className = 'switch setting is-rounded';

    const checkbox = toggle.appendChild(document.createElement('input'));
    checkbox.type = 'checkbox';
    if (checked) { checkbox.setAttribute('checked', 'checked'); }

    const check = toggle.appendChild(document.createElement('span'));
    check.className = 'check';

    const ctrLabel = toggle.appendChild(document.createElement('span'));
    ctrLabel.className = 'control-label';

    const ariaLabel = ctrLabel.appendChild(document.createElement('span'));
    ariaLabel.ariaLabel = label;
    ariaLabel.textContent = label;

    checkbox.addEventListener("change", function (event) { onStateChange(this.checked); });

    return toggle;
}

function makeButton(label, onClick) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = label;

    button.addEventListener("click", function (event) { onClick(); });

    return button;
}

async function main() {
    const { DropboxCloud } = await promiseDbxCloud;

    const redirectURI = 'https://oauth-redirect-1tzx3sxxjt93.deno.dev/';
    const appId = 'Auto-save';
    const tokenStorage = {
        loadToken: () => GM_getValue('Auto-save-RT', null),
        saveToken: (token) => GM_setValue('Auto-save-RT', token)
    };
    const dbx = new DropboxCloud(CLIENT_ID, redirectURI, appId, tokenStorage);

    let autosaveID;
    async function setAutosave(active) {
        GM_setValue('Auto-save-Active', active);
        if (active) {
            await dbx.OAuth(300);
            await saveToCloud();
            autosaveID = setInterval(saveToCloud, 6 * 3600 * 1000);
        } else {
            autosaveID = clearInterval(autosaveID);
        }
    }

    async function saveToCloud() {
        const file = new File([unsafeWindow.exportGame()], 'game-save.b64', { type: 'application/base64' });
        await dbx.uploadFile(file);
        console.debug('Saved to cloud.');
    }

    async function loadFromCloud() {
        const downloadResult = await dbx.downloadFile('/game-save.b64');
        const { promise: contentPromise, resolve, reject } = Promise.withResolvers();
        const reader = new FileReader();
        reader.onload = () => { resolve(reader.result) };
        reader.onerror = () => { reject(reader.error) };
        reader.readAsText(downloadResult.fileBlob);

        unsafeWindow.importGame(await contentPromise);

        console.debug('Loaded from cloud.');
    }

    await setAutosave(GM_getValue('Auto-save-Active', false));

    await waitFor('#settings').then( (settingsElem) => {
        const toggleNode = makeToggle("Enable autosave", GM_getValue('Auto-save-Active', false), setAutosave);
        settingsElem.querySelector('.switch.setting:last-of-type').after(toggleNode);
    });

    await waitFor(':nth-last-child(1 of .importExport)').then( (importExport) => {
        const buttonSave = makeButton("Save to cloud", saveToCloud);
        const buttonLoad = makeButton("Load from cloud", loadFromCloud);
        importExport.lastChild.after(buttonSave, buttonLoad);
    });
}

main();
