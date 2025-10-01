export type AccountType = "LDAP" | "Локальная";

export interface LabelTag {
    text: string;
}

export interface Account {
    id: string;
    labels: LabelTag[];
    type: AccountType;
    login: string;
    password: string | null;
}

export interface EditableAccount extends Account {
    labelInput: string;
    errors?: Partial<Record<"labels" | "type" | "login" | "password", string>>;
}
