
CREATE TABLE IF NOT EXISTS pile.account (
    id UUID PRIMARY KEY,
    iban VARCHAR(34) NOT NULL UNIQUE,
    country_code VARCHAR(3) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pile.account_balance (
    account_id UUID NOT NULL,
    balance INTEGER NOT NULL,
    currency_code VARCHAR(3) NOT NULL,

    PRIMARY KEY (account_id, currency_code)
);

