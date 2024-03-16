
## Decision Log

This log is a record of the points of ambiguity in the project, the decisions I made, and why.

### Database

I chose to use PostgreSQL as the database for this project, because it's the relational database I'm most familiar with,
and the transactional guarantees of a relational database are important when dealing with financial data and transactions.

This will likely make it more difficult to unit test the repository, as postgres doesn't have an in-memory or
mock representation I could use for my tests.

### Balances and Currencies

The inclusion of the currency code in the provided accounts.json file suggests that accounts can be in non-EUR currencies,
while the requirement for account filtering by balance suggests a singular balance.  I've chosen to represent an account
in such a way that it can have multiple balances, one for each currency.  Each balance is an integer, in the smallest 
unit of the currency (e.g. cents for EUR).

To fulfill the balance filtering requirement, I have opted to make it a requirement that the user specify the currency
they are filtering by, in addition to the minimum and maximum balances.

If, in the real project, it was determined that accounts should only have a single balance, I would represent the 
database schema in a much simpler form, in a single table.

### Authentication / Authorization

I have chosen to not implement any form of authentication or authorization for this project, as it was not mentioned
in the requirements.  In a real project, I would expect to have to implement some form of authentication and authorization,
whether this is intended to be used only by internal admins, or by external users.

If I were to implement user authentication, I'd take the following steps:

- Implement a user table, with a username and password hash OR use a third-party authentication service
- Implement a JWT cookie to store authentication info in a temporary way
- Implement middleware to check for the presence of the JWT cookie and validate it
- Switch the SEPA transfer process to use the currently logged in account ID, instead of the provided IBAN
- Implement a user role system, to allow only administrators to view the full list of accounts, or look up an account by IBAN
- Add a new endpoint to return the logged-in user's account information

### Caching

I have opted to not cache the responses at this time.  It depends on the use case, but if this were a customer-facing,
performance-critical application, I would likely implement transactions as more of a push/subscribe model, where
transactions immediately update a cache.  This would provide the up-to-date accuracy required in a financial application,
while also providing the performance benefits of a cache.

### Error Handling

I have chosen to implement error handling using a simple console.error.  In a real project, I would likely use a logging
library, and use a service like Sentry to capture and report errors.  

Whenever an error occurs within a transaction,
I trigger a rollback, and log the error.  If the server crashes or shuts down during transactions, the transactions
will be left in an incomplete state, which could automatically be rolled back by postgres with appropriate production
config settings.

