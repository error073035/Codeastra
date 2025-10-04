const express = require("express");
const app = express();
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectToDb = require("./db/connection");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

dotenv.config();
connectToDb();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const userRoute = require("./routes/user.routes.js");
app.use("/api/v1/users", userRoute);

const errorMiddleware = require("./middlewares/error.middlware.js");
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
