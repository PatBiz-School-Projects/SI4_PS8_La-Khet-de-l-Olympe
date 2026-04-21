import {isMobile} from "/utils/platform.js";

export class AppMobileNavbar extends HTMLElement {
    constructor() {
        super();
    }
    async connectedCallback() {

        if(isMobile()){
            this.style.display = 'none';
            return;
        }

        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/shared/components/app-mobile-navbar/app-mobile-navbar.html"),
                fetch("/shared/components/app-mobile-navbar/app-mobile-navbar.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            const pageType = this.getAttribute('page');
            this.adaptNavbar(pageType)
        } catch (err) {
            console.error("Error while loading the component:", err)
        }
    }
    adaptNavbar(pageType) {
        const navContainer = this.querySelector('#app-mobile-navbar');

        if (pageType === 'game') {
            //à voir pour quit et info
            navContainer.innerHTML = `
                <button class="nav-item" type="button" data-section="quit">
                    <span class="icon" aria-hidden="true">🏳️</span>
                    <span class="text">Abandonner</span>
                </button>
                <button class="nav-item" type="button" data-section="chat">
                    <span class="icon" aria-hidden="true">💬</span>
                    <span class="text">Chat</span>
                </button>
                <button class="nav-item" type="button" data-section="info">
                    <span class="icon" aria-hidden="true">?</span>
                    <span class="text">Info</span>
                </button>
            `;
            navContainer.style.backgroundColor = "#1a1a1a";
            navContainer.style.color = "white";
        }
        else if (pageType === 'home') {

        }
    }


}
customElements.define('app-mobile-navbar', AppMobileNavbar);
