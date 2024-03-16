import { Request, Response } from 'express';
import {AccountService} from "./accountService";
import { z } from 'zod';

export interface AccountController {
    getAccountByIBAN: (req: Request, res: Response) => Promise<void>;
    listAccounts: (req: Request, res: Response) => Promise<void>;
    transfer: (req: Request, res: Response) => Promise<void>;
}

const IBANSchema = z.string().length(22);

const ListAccountsParamsSchema = z.object({
    page: z.coerce.number().int().positive(),
    pageSize: z.coerce.number().int().positive().max(100),
    currencyCode: z.string().length(3),
    minBalance: z.coerce.number().int().optional(),
    maxBalance: z.coerce.number().int().optional(),
});

const TransferCommandSchema = z.object({
    fromIBAN: IBANSchema,
    toIBAN: IBANSchema,
    amount: z.number().int().positive(),
    currencyCode: z.string().length(3),
    toBIC: z.string().length(11),
    reference: z.string().max(140),
});

export const createAccountController = (accountService: AccountService): AccountController => {
    const getAccountByIBAN = async (req: Request, res: Response) => {
        const iban = IBANSchema.parse(req.params.iban);
        const account = await accountService.getByIBAN(iban);
        if (!account) {
            res.status(404).send("Account not found");
            return;
        } else {
            res.status(200).json(account);
        }
    }

    const listAccounts = async (req: Request, res: Response) => {
        const params = ListAccountsParamsSchema.parse(req.query);
        const accounts = await accountService.getAll(
            params.page,
            params.pageSize,
            params.currencyCode,
            params.minBalance,
            params.maxBalance
        );
        res.status(200).json(accounts);
    }

    const transfer = async (req: Request, res: Response) => {
        const transferCommand = TransferCommandSchema.parse(req.body);
        const result = await accountService.transfer(transferCommand);
        res.status(result.success ? 200 : 409).json(result);
    }

    return {
        getAccountByIBAN,
        listAccounts,
        transfer
    }
}

