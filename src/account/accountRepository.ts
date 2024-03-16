import {Account, AccountBalance, Transfer} from "./accountModel";
import {Pool} from "pg";
import {DateTime} from "luxon";

export interface AccountRepository {
    getByIBAN: (iban: string) => Promise<Account | undefined>;
    getAll: (page: number, perPage: number, filterCurrency: string, minBalance?: number, maxBalance?: number) => Promise<Account[]>;
    create: (account: Account) => Promise<Account>;
    transfer: (transfer: Transfer) => Promise<{ success: boolean, reason?: string }>;
}

export const createAccountRepository = (pool: Pool): AccountRepository => {
    const transformResults = (results: any[]): Account[] => {
        const accountMap = new Map<string, Account>();

        results.forEach(row => {
            let account = accountMap.get(row.id);

            if (!account) {
                account = {
                    id: row.id,
                    name: row.name,
                    iban: row.iban,
                    countryCode: row.country_code,
                    createdAt: DateTime.fromJSDate(row.created_at),
                    balances: []
                };
                accountMap.set(row.id, account);
            }

            account.balances.push({
                balance: row.balance,
                currencyCode: row.currency_code
            });
        });

        return Array.from(accountMap.values());
    };

    const getByIBAN = async (iban: string): Promise<Account | undefined> => {
        const results = await pool.query(`
            SELECT id, name, iban, country_code, created_at, balance, currency_code 
                FROM pile.account 
                    LEFT JOIN pile.account_balance ON account.id = account_balance.account_id 
                    WHERE iban = $1`, [iban]);

        const transformedResults = transformResults(results.rows);

        if (transformedResults.length > 1) {
            throw new Error("Multiple accounts with the same IBAN");
        }

        if (transformedResults.length === 0) {
            return undefined;
        }

        return transformedResults[0];
    }

    const getAll = async (page: number, perPage: number, filterCurrency: string, minBalance?: number, maxBalance?: number): Promise<Account[]> => {
        // Splitting into a subquery is necessary to use LIMIT and OFFSET, limiting the number of accounts, and not
        // the number of balances.  The subquery has been extracted into a separate constant to make the main query
        // more readable.

        const subquery = `
            SELECT id, iban, country_code, created_at, name FROM pile.account
                LEFT JOIN pile.account_balance ON account.id = account_balance.account_id
                WHERE currency_code = $1
                AND ($2 = -1 OR balance >= $2)
                AND ($3 = -1 OR balance <= $3)
                LIMIT $4 OFFSET $5`;

        const results = await pool.query(`
            SELECT account.id, account.name, account.iban, account.country_code, account.created_at, balance, currency_code 
                FROM (${subquery}) as account
                    LEFT JOIN pile.account_balance ON account.id = account_balance.account_id`,
            [filterCurrency, minBalance ?? -1, maxBalance ?? -1, perPage, (page - 1) * perPage]);

        return transformResults(results.rows);
    }

    const create = async (account: Account): Promise<Account> => {
        const connection = await pool.connect();
        await connection.query('BEGIN');

        try {
            const result = await connection.query(`
                INSERT INTO pile.account (id, name, iban, country_code, created_at) 
                    VALUES ($1, $2, $3, $4, $5) 
                    RETURNING id`, [account.id, account.name, account.iban, account.countryCode, account.createdAt.toJSDate()]);

            await Promise.all(account.balances.map(balance => {
                return connection.query(`
                    INSERT INTO pile.account_balance (account_id, balance, currency_code) 
                        VALUES ($1, $2, $3)`, [result.rows[0].id, balance.balance, balance.currencyCode]);
            }));

            await connection.query('COMMIT');
            return account;
        } catch (error) {
            await connection.query('ROLLBACK');
            throw error;
        } finally {
            connection.release();
        }
    }

    const transfer = async (transfer: Transfer): Promise<{ success: boolean, reason?: string }> => {
        // Turning this into a single query would be more performant, but would make the code less readable.
        // For now, I've opted for the more readable approach, but this could be revisited if performance
        // becomes an issue.

        const connection = await pool.connect();
        await connection.query('BEGIN');

        try {
            const fromAccountResults = await connection.query(`
                SELECT id, balance
                    FROM pile.account 
                        JOIN pile.account_balance ON account.id = account_balance.account_id
                            AND account_balance.currency_code = $1
                        WHERE iban = $2`, [transfer.currencyCode, transfer.fromIBAN]);

            if (fromAccountResults.rows.length === 0) {
                return { success: false, reason: "From account does not exist" };
            }

            if (fromAccountResults.rows.length > 1) {
                return { success: false, reason: "Multiple from accounts with the sender IBAN" };
            }

            const fromAccount = fromAccountResults.rows[0];

            if (fromAccount.balance < transfer.amount) {
                return { success: false, reason: "Insufficient funds" };
            }

            const toAccountResults = await connection.query(`
                SELECT id, balance, currency_code 
                    FROM pile.account 
                        LEFT JOIN pile.account_balance ON account.id = account_balance.account_id 
                            AND account_balance.currency_code = $1
                        WHERE iban = $2`, [transfer.currencyCode, transfer.toIBAN]);

            if (toAccountResults.rows.length === 0) {
                return { success: false, reason: "To account does not exist" };
            }

            if (toAccountResults.rows.length > 1) {
                return { success: false, reason: "Multiple to accounts with the target IBAN" };
            }

            const toAccount = toAccountResults.rows[0];

            await connection.query(`
                UPDATE pile.account_balance
                    SET balance = balance - $1
                    WHERE account_id = $2 AND currency_code = $3`, [transfer.amount, fromAccount.id, transfer.currencyCode]);

            if (toAccount.currency_code) {
                await connection.query(`
                    UPDATE pile.account_balance
                        SET balance = balance + $1
                        WHERE account_id = $2 AND currency_code = $3`, [transfer.amount, toAccount.id, transfer.currencyCode]);
            } else {
                await connection.query(`
                    INSERT INTO pile.account_balance (account_id, balance, currency_code)
                        VALUES ($1, $2, $3)`, [toAccount.id, transfer.amount, transfer.currencyCode]);
            }

            await connection.query(`
                INSERT INTO pile.transfer (id, from_iban, to_iban, created_at, amount, currency_code, to_bic, reference)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [transfer.id, transfer.fromIBAN, transfer.toIBAN, transfer.createdAt.toJSDate(), transfer.amount, transfer.currencyCode, transfer.toBIC, transfer.reference]);

            await connection.query('COMMIT');
            return { success: true };
        } catch (error) {
            await connection.query('ROLLBACK');
            console.error(error);
            return { success: false, reason: "Transfer failed" };
        } finally {
            connection.release();
        }
    }

    return {
        getByIBAN,
        getAll,
        create,
        transfer
    }
}