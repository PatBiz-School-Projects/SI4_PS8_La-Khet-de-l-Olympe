import { escapeHtml } from "/utils/security.js";


/**
 * @typedef {Object} ChatUser
 *
 * @prop {string} userId
 * @prop {string} username
 * @prop {string} profilePicture
 */
export const ChatUser = undefined;


/**
 * @typedef {Object} ChatMessage
 *
 * @prop {number} index
 * @prop {ChatUser} author
 * @prop {string} content
 * @prop {number} uploadTimestamp
 */
export const ChatMessage = undefined;


export class ChatBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        /** @private @type {ChatMessage[]} */
        this._messages = [];

        /** @private @type {string | undefined} */
        this._chatId;

        /** @private @type {boolean} */
        this._isFolded = true;

        /** @private @type {IntersectionObserver | undefined} */
        this._sentinelObserver = null;

        /** @private @type {boolean} */
        this._isFetchingMessages = false;
    }

    /**
     * @private
     */
    _initEventListeners() {
        const chatHeader   = this.shadowRoot.getElementById('chat-header');
        const messageInput = this.shadowRoot.getElementById('message-input');
        const sendBtn      = this.shadowRoot.getElementById('send-btn');

        chatHeader.onclick = _ => (
            // Unfold/Fold the chat on header click
            this.isFolded()
            ? this.unfold()
            : this.fold()
        );

        messageInput.oninput = _ => {
            // Toggle the send button based on whether there is something to send or not
            sendBtn.disabled = messageInput.value.trim().length === 0;
        }

        sendBtn.onclick = _ => this._sendMessage();
        messageInput.addEventListener('keydown', (e) => {
            // Send the message when Return is pressed (w/o Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._sendMessage();
            }
        });
    }

    /**
     * @private
     *
     * Set an `IntersectionObserver` on the sentinel (at the top of the chat box)
     * to trigger f
                    etch of older messages when the user get to the top of the message list
     */
    _initSentinelObserver() {
        const sentinel = this.shadowRoot.getElementById('load-sentinel');
        const wrapper  = this.shadowRoot.getElementById('messages-wrapper');

        this._sentinelObserver = new IntersectionObserver(
            async (entries) => {
                if (
                    !this.isFolded()
                    && entries[0].isIntersecting
                    && !this._isFetchingMessages
                ) {
                    this._isFetchingMessages = true;

                    this._toggleLoadingAnimation(true);
                    const messages = await this._fetchMessages();
                    this._toggleLoadingAnimation(false);

                    // Disable the sentinel if the client already fetched all chat messages
                    if (messages.length === 0) {
                        this._sentinelObserver.disconnect();
                        this._isFetchingMessages = false;
                        return;
                    }

                    // Save the scroll position before the prepend
                    const prevScrollHeight = wrapper.scrollHeight ?? 0;

                    this._prependMessages(messages);

                    // Restore the scroll position to not jump when older messages are prepended
                    if (wrapper) {
                        wrapper.scrollTop = wrapper.scrollHeight - prevScrollHeight;
                    }

                    this._isFetchingMessages = false;
                }
            },
            { root: wrapper, threshold: 0 }
        );

        this._sentinelObserver.observe(sentinel);
    }

    /**
     * Called when the web component is added to the DOM.
     */
    async connectedCallback() {
        try {
            // Load the component's HTML template & CSS style

            const [htmlResponse, cssResponse] = await Promise.all([
                fetch("/chat/components/chat-box/chat-box.html"),
                fetch("/chat/components/chat-box/chat-box.css"),
            ]);

            const html = await htmlResponse.text();
            const css = await cssResponse.text();

            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                ${html}
            `;
        } catch (err) {
            console.error("Error while loading the component:", err)
            return;
        }

        this._initEventListeners();
        this._initSentinelObserver();
    }

    /**
     * Called when the web component is removed from the DOM.
     */
    async disconnectedCallback() {
        // To prevent memory leak
        this._sentinelObserver?.disconnect();
    }


    ////////////////////////////////////////////////////////////////////////////
    // Getters & Setters

    /** @type {string} */
    get chatId() {
        if (!this._chatId) {
            throw new Error("Chat id hasn't been set");
        }
        return this._chatId;
    }
    set chatId(id) {
        if (this._chatId) {
            throw new Error("Chat id has already been set");
        }
        this._chatId = id;
    }

    /** @returns {boolean} */
    isFolded() {
        return this._isFolded;
    }


    ////////////////////////////////////////////////////////////////////////////
    // Operations

    async actualise() {
        if (!this.isFolded()) {
            this._toggleLoadingAnimation(true);
        }

        this._appendMessages(await this._fetchMessages());

        if (!this.isFolded()) {
            this._toggleLoadingAnimation(false);
            this._scrollToBottom();
        }
    }

    fold() {
        this._isFolded = true;

        const root = this.shadowRoot.getElementById('chat-box');
        if (root) {
            root.dataset.state = 'folded';
        }
    }

    unfold() {
        this._isFolded = false;

        const root = this.shadowRoot.getElementById('chat-box');
        if (root) {
            root.dataset.state = 'unfolded';
        }

        const emptinessIndicator = this.shadowRoot.getElementById('empty-state');
        if (emptinessIndicator) {
            emptinessIndicator.hidden = (this._messages.length !== 0);
        }

        // Scroll vers le bas après la fin de la transition CSS (≈ 420 ms)
        setTimeout(() => this._scrollToBottom(), 440);
    }

    async onNewMessage(message) {
        this._appendMessages([message]);

        if (!this.isFolded()) {
            const emptinessIndicator = this.shadowRoot.getElementById('empty-state');
            if (emptinessIndicator) {
                emptinessIndicator.hidden = true;
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////
    // Helpers

    /**
     * @private
     */
    _scrollToBottom() {
        const wrapper = this.shadowRoot.getElementById('messages-wrapper');
        if (wrapper) {
            wrapper.scrollTop = wrapper.scrollHeight;
        }
    }

    /**
     * @private
     * @param {boolean} shows
     */
    _toggleLoadingAnimation(shows) {
        const elem = this.shadowRoot.getElementById('loading-older');
        if (elem) {
            elem.hidden = !shows
        };
    }

    /**
     * @private
     *
     * @returns {Promise<ChatMessage[]>}
     */
    async _fetchMessages() {
        const response = await fetch(`/api/chats/${this.chatId}/messages?start=${this._messages.length}`);
        if (!response.ok) {
            throw new Error((await response.json()).error);
        }

        const { messages } = await response.json();
        return messages;
    }

    /**
     * @private
     */
    async _sendMessage() {
        const input   = this.shadowRoot.getElementById('message-input');
        const sendBtn = this.shadowRoot.getElementById('send-btn');

        const messageContent = input.value.trim();
        if (!messageContent) {
            return;
        }

        input.value = '';
        sendBtn.disabled = true;

        this.dispatchEvent(new CustomEvent('send-message', {
            detail: { content: messageContent },
            bubbles: true,
            composed: true,
        }));

        sendBtn.disabled = false;
    }


    /**
     * @private
     *
     * Creates a DOM element for a chat message
     *
     * @param {ChatMessage} message
     * @param {boolean} [animate=true]
     *
     * @returns {HTMLElement}
     */
    _createMessageElement(message, animate = true) {
        const div = document.createElement('div');
        div.classList.add('chat-message');

        if (!animate) {
            div.style.animationDuration = '0s';
        }

        const time = new Date(
            message.uploadTimestamp
        ).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const username = message.author?.username ?? "Inconnu";
        const profilePic = message.author?.profilePicture ?? "none.svg";

        div.innerHTML = `
            <img
                class="chat-message-avatar"
                src="/assets/${profilePic}"
                alt="${escapeHtml(username)}"
            />
            <div class="chat-message-body">
                <div class="chat-message-header">
                    <span class="chat-message-author">${escapeHtml(username)}</span>
                    <span class="chat-message-time">${time}</span>
                </div>
                <p class="chat-message-content">${escapeHtml(message.content)}</p>
            </div>
        `;

        return div;
    }

    /**
     * @private
     *
     * Prepends message elements to the message list.
     *
     * @param {ChatMessage[]} messages
     */
    _prependMessages(messages) {
        this._messages = [...messages, ...this._messages];

        const container = this.shadowRoot.getElementById('messages-container');
        if (!container) {
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const msg of messages) {
            // No animations for older messages as it'd be too much
            fragment.appendChild(this._createMessageElement(msg, false));
        }
        container.insertBefore(fragment, container.firstChild);
    }

    /**
     * @private
     *
     * Appends message elements to the message list.
     *
     * @param {ChatMessage[]} messages
     */
    _appendMessages(messages) {
        this._messages = [...this._messages, ...messages];

        const container = this.shadowRoot.getElementById('messages-container');
        if (!container) {
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const msg of messages) {
            fragment.appendChild(this._createMessageElement(msg));
        }
        container.appendChild(fragment);
    }
}
customElements.define('chat-box', ChatBox);
