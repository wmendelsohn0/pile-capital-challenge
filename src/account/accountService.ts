import {Account, TransferCommand} from "./accountModel";
import {AccountRepository} from "./accountRepository";
import {v4} from "uuid";
import {DateTime} from "luxon";

export interface AccountService {
    getByIBAN: (iban: string) => Promise<Account | undefined>;
    getAll: (page: number, perPage: number, filterCurrency: string, minBalance?: number, maxBalance?: number) => Promise<Account[]>;
    transfer: (transfer: TransferCommand) => Promise<{ success: boolean, reason?: string }>;
}

export const createAccountService = (accountRepository: AccountRepository): AccountService => {
    const transfer = async (transfer: TransferCommand): Promise<{ success: boolean, reason?: string }> => {
        const id = v4();
        const createdAt = DateTime.now();

        return await accountRepository.transfer({
            id,
            fromIBAN: transfer.fromIBAN,
            toIBAN: transfer.toIBAN,
            createdAt,
            amount: transfer.amount,
            currencyCode: transfer.currencyCode,
            toBIC: transfer.toBIC,
            reference: transfer.reference
        });
    }

    return {
        getByIBAN: accountRepository.getByIBAN,
        getAll: accountRepository.getAll,
        transfer
    }
}