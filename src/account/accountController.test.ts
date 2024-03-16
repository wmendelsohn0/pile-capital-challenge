import { createAccountController } from "./accountController";
import { AccountService } from "./accountService";
import { Request, Response } from "express";
import { Account } from "./accountModel";
import { DateTime } from "luxon";
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
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
};

const createMockAccountService = (): Partial<AccountService> => {
    return {
        getByIBAN: jest.fn(async () => TEST_ACCOUNT),
        getAll: jest.fn(async () => [TEST_ACCOUNT]),
        transfer: jest.fn(async () => ({ success: true }))
    };
};

describe('AccountController', () => {
    const accountService = createMockAccountService() as AccountService;
    const accountController = createAccountController(accountService);

    test('getAccountByIBAN sends correct account data', async () => {
        const req: Partial<Request> = { params: { iban: TEST_ACCOUNT.iban } };
        const res = mockResponse();

        await accountController.getAccountByIBAN(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(TEST_ACCOUNT);
    });

    test('getAccountByIBAN sends 404 for missing account', async () => {
        const req: Partial<Request> = { params: { iban: 'NOT_FOUND_000000000000' } };
        const res = mockResponse();
        accountService.getByIBAN = jest.fn(async () => undefined);

        await accountController.getAccountByIBAN(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith("Account not found");
    });

    test('listAccounts sends correct accounts data', async () => {
        const req: Partial<Request> = { query: { page: '1', pageSize: '10', currencyCode: 'EUR' } };
        const res = mockResponse();

        await accountController.listAccounts(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([TEST_ACCOUNT]);
    });

    test('transfer handles transfer command correctly', async () => {
        const req: Partial<Request> = {
            body: {
                fromIBAN: 'DE89370400440532013000',
                toIBAN: 'DE89370400440532013001',
                amount: 100,
                currencyCode: 'EUR',
                toBIC: '12345678901',
                reference: 'Test Transfer'
            }
        };
        const res = mockResponse();

        await accountController.transfer(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('transfer sends 409 for failed transfer', async () => {
        const req: Partial<Request> = {
            body: {
                fromIBAN: 'DE89370400440532013000',
                toIBAN: 'DE89370400440532013001',
                amount: 100,
                currencyCode: 'EUR',
                toBIC: '12345678901',
                reference: 'Test Transfer'
            }
        };
        const res = mockResponse();

        accountService.transfer = jest.fn(async () => ({ success: false }));

        await accountController.transfer(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });
});
