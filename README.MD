
### Running the project

You should be running Node 20.11.1 or a compatible version.

To run the project, you'll need to have a PostgreSQL database running.  This can be set up easily using docker.

```bash
cd database
docker-compose up
```

Then, to launch the project itself

```bash
npm install
npm start
```

To run the tests, use the following command once the project is running.

```bash
npm test
```

