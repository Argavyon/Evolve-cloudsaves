// ==UserScript==
// @name         Auto-save
// @namespace    http://argavyon.github.io/
// @version      2024-12-19
// @description  try to take over the world!
// @author       Argavyon
// @match        https://pmotschmann.github.io/Evolve/
// @icon         https://pmotschmann.github.io/Evolve/evolved.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// ==/UserScript==

const promiseDbxCloud = import('https://cdn.jsdelivr.net/gh/Argavyon/Cloud-API-with-Dropbox/DropboxCloud.esm.js');
const CLIENT_ID = 'v0o2yze7wrd6p4i';

async function autosave() {
    const { DropboxCloud } = await promiseDbxCloud;

    const redirectURI = 'https://oauth-redirect-1tzx3sxxjt93.deno.dev/';
    const appId = 'Auto-save';
    const tokenStorage = { loadToken: () => GM_getValue('Auto-save-RT', null), saveToken: (token) => GM_setValue('Auto-save-RT', token) };
    const dbx = new DropboxCloud(CLIENT_ID, redirectURI, appId, tokenStorage);

    async function save() {
        const file = new File([unsafeWindow.exportGame()], 'game-save.b64', { type: 'application/base64' });
        await dbx.uploadFile(file);
    }

    await dbx.OAuth(300);
    await save();

    setInterval(save, 6 * 3600 * 1000);
}

autosave();
