import {createAccountRepository} from "./accountRepository";
import {createPool} from "../database";
import {DateTime} from "luxon";
import {v4} from "uuid";

const accountRepository = createAccountRepository(createPool());

const randomizeIBAN = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let iban = 'DE';
    for (let i = 0; i < 20; i++) {
        iban += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return iban;
}

describe('AccountRepository', () => {
    test('getByIBAN returns undefined for non-existent IBAN', async () => {
        const account = await accountRepository.getByIBAN("non-existent-iban");
        expect(account).toBeUndefined();
    });

    test('getByIBAN returns the correct account', async () => {
        const account = await accountRepository.getByIBAN("DE56530041836982318248");
        expect(account).toEqual({
            id: "5f1b6eb7-885f-4f85-af57-a4694ab62eec",
            iban: "DE56530041836982318248",
            countryCode: "DEU",
            createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
            name: "auu9v",
            balances: [
                {
                    balance: 12313219,
                    currencyCode: 'EUR'
                }
            ]
        })
    });

    test('getAll returns one page of results, with a matching currency', async () => {
        const accounts = await accountRepository.getAll(1, 5, "EUR");
        expect(accounts).toEqual([
            {
                id: "2fd5e4e0-16e2-4337-b63d-22582d2623f5",
                iban: "DE03678822021961930232",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "61tuh",
                balances: [
                    {
                        balance: 8072270,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "5f1b6eb7-885f-4f85-af57-a4694ab62eec",
                iban: "DE56530041836982318248",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "auu9v",
                balances: [
                    {
                        balance: 12313219,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "c0b27cef-cd23-427d-beba-78ad83cb253b",
                iban: "DE14395038276359144198",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "8hdtmg",
                balances: [
                    {
                        balance: 83847557,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "fd5f8f4d-f628-45e2-a760-4abc58efb472",
                iban: "DE49742216366983304106",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "215yng",
                balances: [
                    {
                        balance: 33665645,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "a122bf4e-4d0a-40be-89c6-cc2c62116770",
                iban: "DE51656568681196355587",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "gpuni",
                balances: [
                    {
                        balance: 39883631,
                        currencyCode: 'EUR'
                    }
                ]
            }
        ])
    });

    test('getAll uses the page number to return the chosen page of results', async () => {
        const accounts = await accountRepository.getAll(2, 2, "EUR");
        expect(accounts).toEqual([
            {
                id: "c0b27cef-cd23-427d-beba-78ad83cb253b",
                iban: "DE14395038276359144198",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "8hdtmg",
                balances: [
                    {
                        balance: 83847557,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "fd5f8f4d-f628-45e2-a760-4abc58efb472",
                iban: "DE49742216366983304106",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "215yng",
                balances: [
                    {
                        balance: 33665645,
                        currencyCode: 'EUR'
                    }
                ]
            },
        ])
    });

    test('getAll returns only accounts with a balance within the specified range', async () => {
        const accounts = await accountRepository.getAll(1, 5, "EUR", 8000000, 9000000);
        expect(accounts).toEqual([
            {
                id: "2fd5e4e0-16e2-4337-b63d-22582d2623f5",
                iban: "DE03678822021961930232",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "61tuh",
                balances: [
                    {
                        balance: 8072270,
                        currencyCode: 'EUR'
                    }
                ]
            },
            {
                id: "7d954d00-00bf-4fea-8ecc-dac6f03022aa",
                iban: "DE71688570249021483389",
                countryCode: "DEU",
                createdAt: DateTime.fromISO("2023-10-31T11:37:57.051Z"),
                name: "5ujjm",
                balances: [
                    {
                        balance: 8319428,
                        currencyCode: 'EUR'
                    }
                ]
            }
        ])
    });

    test('New accounts can be added', async () => {
        const iban = randomizeIBAN();
        const newAccount = {
            id: v4(),
            name: "Test Account",
            iban,
            countryCode: "DEU",
            createdAt: DateTime.now(),
            balances: [
                {
                    balance: 1000000,
                    currencyCode: "EUR"
                }
            ]
        }
        await accountRepository.create(newAccount);
        const account = await accountRepository.getByIBAN(iban);
        expect(account).toEqual(newAccount);
    });

    test('Money can be transferred between accounts', async () => {
        const fromIBAN = randomizeIBAN();
        const toIBAN = randomizeIBAN();
        const fromAccount = {
            id: v4(),
            name: "Test Account",
            iban: fromIBAN,
            countryCode: "DEU",
            createdAt: DateTime.now(),
            balances: [
                {
                    balance: 1500000,
                    currencyCode: "EUR"
                }
            ]
        }
        const toAccount = {
            id: v4(),
            name: "Test Account",
            iban: toIBAN,
            countryCode: "DEU",
            createdAt: DateTime.now(),
            balances: [
                {
                    balance: 1500000,
                    currencyCode: "EUR"
                }
            ]
        }
        await accountRepository.create(fromAccount);
        await accountRepository.create(toAccount);
        const transfer = {
            id: v4(),
            fromIBAN,
            toIBAN,
            createdAt: DateTime.now(),
            amount: 100000,
            currencyCode: "EUR",
            toBIC: "BIC",
            reference: "Reference"
        }
        const result = await accountRepository.transfer(transfer);
        expect(result).toEqual({ success: true });
        const fromAccountAfter = await accountRepository.getByIBAN(fromIBAN);
        const toAccountAfter = await accountRepository.getByIBAN(toIBAN);
        expect(fromAccountAfter!.balances[0].balance).toBe(1400000);
        expect(toAccountAfter!.balances[0].balance).toBe(1600000);
    });

    test('Money cannot be transferred from an account with insufficient funds', async () => {
        const fromIBAN = randomizeIBAN();
        const toIBAN = randomizeIBAN();
        const fromAccount = {
            id: v4(),
            name: "Test Account",
            iban: fromIBAN,
            countryCode: "DEU",
            createdAt: DateTime.now(),
            balances: [
                {
                    balance: 50000,
                    currencyCode: "EUR"
                }
            ]
        }
        const toAccount = {
            id: v4(),
            name: "Test Account",
            iban: toIBAN,
            countryCode: "DEU",
            createdAt: DateTime.now(),
            balances: [
                {
                    balance: 1500000,
                    currencyCode: "EUR"
                }
            ]
        }
        await accountRepository.create(fromAccount);
        await accountRepository.create(toAccount);
        const transfer = {
            id: v4(),
            fromIBAN,
            toIBAN,
            createdAt: DateTime.now(),
            amount: 100000,
            currencyCode: "EUR",
            toBIC: "BIC",
            reference: "Reference"
        }
        const result = await accountRepository.transfer(transfer);
        expect(result).toEqual({ success: false, reason: "Insufficient funds" });
    });
});

