import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";
import {API_HOST} from "/env.js"

export class ChatMobileComponent {
    constructor(chatBoxElement, userId) {
        this.chatBoxElement = chatBoxElement;
        this.userId = userId;
        this.chatSocket = null;
        this.onSendMessage = null;
    }

    async connect() {
        if (!this.chatBoxElement || !this.userId || this.chatSocket) {
            return;
        }

        this.chatSocket = io(`${API_HOST}/global-chat`, {
            path: "/api/chats/socket.io",
        });

        this.chatBoxElement.chatId = "global-chat";
        await this.chatBoxElement.actualise();

        this.chatSocket.on("new-message", async ({ message }) => {
            await this.chatBoxElement.onNewMessage(message);
        });

        this.chatSocket.on("new-user", async ({ user }) => {
            await this.chatBoxElement.onNewUser(user);
        });

        this.chatSocket.on("update-user", async ({ userId, update }) => {
            await this.chatBoxElement.onUserUpdate(userId, update);
        });

        this.onSendMessage = async (event) => {
            const content = event.detail.content;
            this.chatSocket.emit("new-message", {
                message: {
                    author: this.userId,
                    content,
                    uploadTimestamp: Date.now(),
                },
            });
        };

        this.chatBoxElement.addEventListener("send-message", this.onSendMessage);
    }

    disconnect() {
        if (this.onSendMessage) {
            this.chatBoxElement.removeEventListener("send-message", this.onSendMessage);
            this.onSendMessage = null;
        }

        this.chatSocket?.disconnect();
        this.chatSocket = null;
    }
}
