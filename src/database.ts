import {Pool} from "pg";

// In a real application, these would be environment variables, potentially loaded from a .env file

export const createPool = (): Pool => {
    return new Pool({
        user: "pile_user",
        host: "localhost",
        database: "postgres",
        password: "password",
        port: 5432
    });
}