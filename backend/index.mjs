import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import crypto from "crypto";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB
await mongoose.connect(process.env.MONGO_URI);

// Schema
const DocumentSchema = new mongoose.Schema({
  filename: String,
  fileBuffer: Buffer,
  fileHash: String,
  uploader: String,
  blockchainId: Number,
  txHash: String,
  createdAt: { type: Date, default: Date.now }
});
const Document = mongoose.model("Document", DocumentSchema);

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Ethers
const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const artifact = JSON.parse(fs.readFileSync(path.join("abi", "LandRecords.json")));
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, wallet);

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const buffer = req.file.buffer;
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    let doc = new Document({ filename: req.file.originalname, fileBuffer: buffer, fileHash: hash });
    await doc.save();

    const tx = await contract.storeDocument(hash);
    const receipt = await tx.wait();

    const event = receipt.logs.find((l) => l.fragment?.name === "DocumentStored");
    const blockchainId = event?.args?.[0]?.toString();

    doc.blockchainId = blockchainId;
    doc.txHash = receipt.hash;
    await doc.save();

    res.json({ dbId: doc._id, blockchainId, txHash: receipt.hash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Verify
app.get("/verify/:dbId", async (req, res) => {
  const doc = await Document.findById(req.params.dbId);
  if (!doc) return res.status(404).json({ error: "Not found" });

  const onChain = await contract.getDocument(doc.blockchainId);
  res.json({
    dbId: doc._id,
    fileHash: doc.fileHash,
    blockchainId: doc.blockchainId,
    onChainHash: onChain[0],
    verified: onChain[0] === doc.fileHash
  });
});

// Download
app.get("/download/:dbId", async (req, res) => {
  const doc = await Document.findById(req.params.dbId);
  if (!doc) return res.status(404).send("Not found");

  res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
  res.setHeader("Content-Type", "application/pdf");
  res.send(doc.fileBuffer);
});

app.listen(process.env.PORT, () => console.log(`Backend on ${process.env.PORT}`));
