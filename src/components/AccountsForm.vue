<script setup lang="ts">
import { computed, reactive } from "vue";
import { useAccountsStore } from "../stores/accounts";
import type { Account, EditableAccount, AccountType, LabelTag } from "../types";
import { TrashIcon, PlusIcon } from "@heroicons/vue/24/outline";
import { editableAccountSchema, toLabelTags } from "../validation";

const store = useAccountsStore();
const rows = reactive<EditableAccount[]>(store.all.map(toEditable));

function toEditable(a: Account): EditableAccount {
    return { ...a, labelInput: a.labels.map((t) => t.text).join("; ") };
}
function toPersisted(e: EditableAccount): Account {
    const tags: LabelTag[] = toLabelTags(e.labelInput);
    return {
        id: e.id,
        labels: tags,
        type: e.type,
        login: e.login,
        password: e.type === "LDAP" ? null : (e.password ?? ""),
    };
}

function add() {
    const id = store.addEmpty();
    rows.push({
        id,
        labelInput: "",
        labels: [],
        type: "Локальная",
        login: "",
        password: "",
        errors: {},
    });
}
function removeRow(id: string, index: number) {
    store.remove(id);
    rows.splice(index, 1);
}

function applyZodErrors(ea: EditableAccount, result: any) {
    ea.errors = {};
    if (result.success) return;
    for (const issue of result.error.issues) {
        const path = issue.path?.[0] as keyof EditableAccount | undefined;
        const msg = issue.message;
        if (
            path &&
            ["labelInput", "type", "login", "password"].includes(String(path))
        ) {
            (ea.errors as any)[path === "labelInput" ? "labels" : path] = msg;
        } else {
            // общие ошибки можно маппить куда-то ещё; для ТЗ достаточно полей выше
        }
    }
}

function validateAndSave(ea: EditableAccount) {
    const result = editableAccountSchema.safeParse({
        id: ea.id,
        type: ea.type,
        login: ea.login,
        password: ea.password,
        labelInput: ea.labelInput,
    });
    applyZodErrors(ea, result);
    if (!result.success) return false;
    store.upsert(toPersisted(ea));
    return true;
}

function onBlurLabel(ea: EditableAccount) {
    validateAndSave(ea);
}
function onChangeType(ea: EditableAccount, value: AccountType) {
    ea.type = value;
    if (value === "LDAP") ea.password = null;
    else if (ea.password == null) ea.password = "";
    validateAndSave(ea);
}
function onBlurLogin(ea: EditableAccount) {
    validateAndSave(ea);
}
function onBlurPassword(ea: EditableAccount) {
    validateAndSave(ea);
}

const hasRows = computed(() => rows.length > 0);
const typeOptions: AccountType[] = ["LDAP", "Локальная"];
</script>

<template>
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-slate-900">Учетные записи</h2>
            <button class="btn btn-primary gap-2" @click="add">
                <PlusIcon class="w-5 h-5" /> Добавить
            </button>
        </div>

        <p class="hint">
            <b>Подсказка для «Метка»:</b> вводите несколько меток через «;». При
            сохранении они превратятся в массив объектов
            <code>{ text: '...' }</code>.
        </p>

        <div class="labels">
            <div>Метка</div>
            <div>Тип записи</div>
            <div>Логин</div>
            <div>Пароль</div>
            <div>Действия</div>
        </div>

        <div v-if="hasRows">
            <div v-for="(ea, i) in rows" :key="ea.id" class="row mt-3">
                <!-- Метки -->
                <div>
                    <input
                        v-model="ea.labelInput"
                        type="text"
                        placeholder="напр. prod; admin; read-only"
                        class="field"
                        :class="ea.errors?.labels ? 'field-error' : ''"
                        @blur="onBlurLabel(ea)"
                    />
                    <div class="taglist" v-if="ea.labelInput.trim().length">
                        <span
                            class="tag"
                            v-for="t in ea.labelInput
                                .split(';')
                                .map((s) => s.trim())
                                .filter(Boolean)"
                            :key="t"
                            >{{ t }}</span
                        >
                    </div>
                    <p
                        v-if="ea.errors?.labels"
                        class="text-sm text-red-600 mt-1"
                    >
                        {{ ea.errors.labels }}
                    </p>
                </div>

                <!-- Тип -->
                <div>
                    <select
                        :value="ea.type"
                        class="field"
                        :class="ea.errors?.type ? 'field-error' : ''"
                        @change="
                            (e: any) =>
                                onChangeType(ea, e.target.value as AccountType)
                        "
                    >
                        <option
                            v-for="opt in typeOptions"
                            :key="opt"
                            :value="opt"
                        >
                            {{ opt }}
                        </option>
                    </select>
                    <p v-if="ea.errors?.type" class="text-sm text-red-600 mt-1">
                        {{ ea.errors.type }}
                    </p>
                </div>

                <!-- Логин -->
                <div>
                    <input
                        v-model="ea.login"
                        type="text"
                        placeholder="Логин"
                        class="field"
                        :class="ea.errors?.login ? 'field-error' : ''"
                        @blur="onBlurLogin(ea)"
                    />
                    <p
                        v-if="ea.errors?.login"
                        class="text-sm text-red-600 mt-1"
                    >
                        {{ ea.errors.login }}
                    </p>
                </div>

                <!-- Пароль / LDAP -->
                <div>
                    <template v-if="ea.type === 'Локальная'">
                        <input
                            v-model="ea.password as any"
                            type="password"
                            placeholder="Пароль"
                            class="field"
                            :class="ea.errors?.password ? 'field-error' : ''"
                            @blur="onBlurPassword(ea)"
                        />
                        <p
                            v-if="ea.errors?.password"
                            class="text-sm text-red-600 mt-1"
                        >
                            {{ ea.errors.password }}
                        </p>
                    </template>
                    <template v-else>
                        <div class="h-[42px] flex items-center text-slate-500">
                            Скрыто (LDAP)
                        </div>
                    </template>
                </div>

                <!-- Действия -->
                <div class="flex items-center justify-end">
                    <button
                        class="btn btn-ghost-danger gap-2"
                        @click="removeRow(ea.id, i)"
                    >
                        <TrashIcon class="w-5 h-5" /> Удалить
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="mt-4 text-slate-500">
            Список пуст. Нажмите «Добавить», чтобы создать запись.
        </div>
    </div>
</template>

<style scoped></style>
