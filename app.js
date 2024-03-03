require("dotenv").config();
require("express-async-errors");
const bodyParser = require("body-parser");


// Extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const reteLimiter = require("express-rate-limit");

// Swagger
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

const express = require("express");
const app = express();

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect DB
const connectDB = require("./db/connect");

const authenticateUser = require("./middleware/authentication");

// Routers
const authRouter = require("./routes/auth");
const jobsRouter = require("./routes/jobs");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.set("trust proxy", 1);
app.use(
  reteLimiter({
    windows: 15 * 60 * 1000, //15min
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(express.json());

app.use(helmet());
app.use(cors());
app.use(xss());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 9000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
