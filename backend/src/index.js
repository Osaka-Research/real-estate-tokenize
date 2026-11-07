import express from "express";
import cors from "cors";
import propertiesRouter from "./routes/properties.js";
import kycRouter from "./routes/kyc.js";
import feedRouter from "./routes/feed.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/properties", propertiesRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/feed", feedRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`real-estate-tokenize backend on :${PORT}`));
