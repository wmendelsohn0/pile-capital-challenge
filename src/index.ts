import express, {Express, Request, Response, NextFunction} from "express";
import {ZodError} from "zod";
import {createPool} from "./database";
import {createAccountRepository} from "./account/accountRepository";
import {createAccountService} from "./account/accountService";
import {createAccountController} from "./account/accountController";

const handleZodError = (app: Express): void => {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err.name !== 'ZodError') {
            next(err)
            return
        }

        res.status(400).json((err as ZodError).errors)
    })
}

const wrapAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
}

const app = express();
const port = 8080;

app.use(express.json());

const postgres = createPool();
const repository = createAccountRepository(postgres);
const service = createAccountService(repository);
const controller = createAccountController(service);

app.get("/accounts/:iban", wrapAsync(controller.getAccountByIBAN));
app.get("/accounts", wrapAsync(controller.listAccounts));
app.post("/accounts/transfer", wrapAsync(controller.transfer));
handleZodError(app);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})


