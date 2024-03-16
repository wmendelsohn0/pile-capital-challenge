import { DateTime } from "luxon";

export interface Account {
    id: string;
    name: string;
    iban: string;
    countryCode: string;
    createdAt: DateTime;
    balances: AccountBalance[];
}

export interface AccountBalance {
    balance: number; // Integer, in the smallest unit of the currency (e.g. cents)
    currencyCode: string;
}

export interface Transfer {
    id: string;
    fromIBAN: string;
    toIBAN: string;
    createdAt: DateTime;
    amount: number;
    currencyCode: string;
    toBIC: string;
    reference: string;
}

export interface TransferCommand {
    fromIBAN: string;
    toIBAN: string;
    amount: number;
    currencyCode: string;
    toBIC: string;
    reference: string;
}