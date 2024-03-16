import {Pool} from "pg";

export const createPool = (): Pool => {
    return new Pool({
        user: "pile_user",
        host: "localhost",
        database: "postgres",
        password: "password",
        port: 5432
    });
}