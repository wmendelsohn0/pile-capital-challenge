import {AccountRepository} from "./accountRepository";
import {createAccountService} from "./accountService";
import {Account, TransferCommand} from "./accountModel";
import {DateTime} from "luxon";
import Mock = jest.Mock;

const TEST_ACCOUNT: Account = {
    id: '123',
    name: 'Test Account',
    iban: 'DE89370400440532013000',
    countryCode: 'DEU',
    createdAt: DateTime.now(),
    balances: [
        {
            balance: 8319428,
            currencyCode: 'EUR'
        }
    ]
}

const createMockAccountRepository = (): AccountRepository => {
    return {
        getByIBAN: jest.fn(async () => TEST_ACCOUNT),
        getAll: jest.fn(async () => [TEST_ACCOUNT]),
        create: jest.fn(async () => TEST_ACCOUNT),
        transfer: jest.fn(async () => ({ success: true }))
    };
}

describe('AccountService', () => {
    const accountRepository = createMockAccountRepository();
    const accountService = createAccountService(accountRepository);

    test('getByIBAN calls the repository', async () => {
        const result = await accountService.getByIBAN(TEST_ACCOUNT.iban);
        expect(result).toEqual(TEST_ACCOUNT);
    });

    test('getAll calls the repository', async () => {
        const result = await accountService.getAll(1, 10, 'EUR');
        expect(result).toEqual([TEST_ACCOUNT]);
    });

    test('transfer generates an ID and createdAt date, then calls the repository', async () => {
        const transferCommand: TransferCommand = {
            fromIBAN: 'DE89370400440532013000',
            toIBAN: 'DE89370400440532013001',
            amount: 100,
            currencyCode: 'EUR',
            toBIC: 'BIC',
            reference: 'Reference'
        };

        await accountService.transfer(transferCommand);

        const mock = (accountRepository.transfer as Mock<any, any, any>)

        expect(mock).toHaveBeenCalledTimes(1);

        const transfer = mock.mock.calls[0][0];

        expect(transfer.id).toBeDefined();
        expect(transfer.createdAt).toBeDefined();
        expect(transfer.fromIBAN).toEqual(transferCommand.fromIBAN);
        expect(transfer.toIBAN).toEqual(transferCommand.toIBAN);
        expect(transfer.amount).toEqual(transferCommand.amount);
        expect(transfer.currencyCode).toEqual(transferCommand.currencyCode);
        expect(transfer.toBIC).toEqual(transferCommand.toBIC);
        expect(transfer.reference).toEqual(transferCommand.reference);
    });
});