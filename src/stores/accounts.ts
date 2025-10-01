import { defineStore } from "pinia";
import type { Account } from "../types";

const STORAGE_KEY = "accounts:v1";

function load(): Account[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Account[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function save(accounts: Account[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export const useAccountsStore = defineStore("accounts", {
    state: () => ({ items: load() as Account[] }),
    getters: { all: (s) => s.items },
    actions: {
        addEmpty(): string {
            const id = crypto.randomUUID();
            this.items.push({
                id,
                labels: [],
                type: "Локальная",
                login: "",
                password: "",
            });
            save(this.items);
            return id;
        },
        upsert(acc: Account) {
            const idx = this.items.findIndex((a) => a.id === acc.id);
            if (idx === -1) {
                this.items.push(acc);
            } else {
                this.items[idx] = acc;
            }
            save(this.items);
        },
        remove(id: string) {
            this.items = this.items.filter((a) => a.id !== id);
            save(this.items);
        },
    },
});
