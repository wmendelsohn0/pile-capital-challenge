
CREATE TABLE IF NOT EXISTS pile.transfer (
    id UUID PRIMARY KEY,
    from_iban VARCHAR(34) NOT NULL,
    to_iban VARCHAR(34) NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    currency_code VARCHAR(3) NOT NULL,
    to_bic VARCHAR(11) NOT NULL,
    reference VARCHAR(140) NOT NULL
);
