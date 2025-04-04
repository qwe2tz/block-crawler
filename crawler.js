const ethers = require("ethers");
const fs = require("fs");
const path = require("path");


const networks = {
  base: { mainnet: "https://site1.moralis-nodes.com/base/" },
  gnosis: { mainnet: "https://site1.moralis-nodes.com/gnosis" },
  neuroweb: {
    testnet: "https://lofar-testnet.origin-trail.network",
    mainnet: "https://astrosat-parachain-rpc.origin-trail.network",
  },
};

const args = process.argv.slice(2);

const CHAIN = args[0] || "neuroweb";
const CONTRACT_ADDRESS = args[1].toLowerCase();
const START_BLOCK = parseInt(args[2] || 0);
const NET = args[3] || "mainnet";
const OUTPUT_FILE = path.join(__dirname, "output", `${CHAIN}-${NET}-${CONTRACT_ADDRESS}.txt`);
const BATCH_SIZE = 10;
const RETRY_LIMIT = 5;
const RETRY_DELAY = 3000;

console.log(`[INFO] Starting crawler for ${CHAIN} ${NET}, starting from block ${START_BLOCK}`);
console.log(`[INFO] Contract address: ${CONTRACT_ADDRESS}`);

if (!networks[CHAIN][NET]) {
  throw new Error(`Network ${CHAIN} with net ${NET} not supported.`);
}

const API_KEY = args[4] || "";
const url = API_KEY != "" ? networks[CHAIN][NET] + API_KEY : networks[CHAIN][NET];

const provider = new ethers.JsonRpcProvider(url);

const addresses = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getBlockWithRetry(blockNumber, maxRetries = RETRY_LIMIT, delay = RETRY_DELAY) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (block) {
        return block;
      }
    } catch (err) {
      console.error(
        `[ERROR] Block ${blockNumber} fetch failed: ${err.message} (Retrying in ${delay / 1000}s)`
      );
    }
    retries++;
    await sleep(delay);
  }
  console.error(`[FATAL] Failed to fetch block ${blockNumber} after ${maxRetries} retries.`);
  return null;
}

// Fetch transaction details with retry logic
async function getTransactionDetails(txHash, maxRetries = RETRY_LIMIT, delay = RETRY_DELAY) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const tx = await provider.getTransaction(txHash);
      if (tx) {
        return {
          hash: tx.hash,
          from: tx.from.toLowerCase(),
          to: tx.to ? tx.to.toLowerCase() : null,
        };
      }
    } catch (err) {
      console.error(
        `[ERROR] Transaction ${txHash} fetch failed: ${err.message} (Retrying in ${delay / 1000}s)`
      );
    }
    retries++;
    await sleep(delay);
  }
  return null;
}

// Main function to process blocks and transactions
async function processBlocks() {
  try {
    const latestBlock = await provider.getBlockNumber();
    console.log(`[INFO] Latest block on chain: ${latestBlock}`);
    console.log(`[INFO] Starting from block ${START_BLOCK}`);

    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    }
    const writeStream = fs.createWriteStream(OUTPUT_FILE, { flags: "a" });

    for (let batchStart = START_BLOCK; batchStart <= latestBlock; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, latestBlock);
      const batchPromises = [];
      for (let blockNumber = batchStart; blockNumber <= batchEnd; blockNumber++) {
        batchPromises.push(getBlockWithRetry(blockNumber));
      }

      await sleep(1000);
      const blocks = await Promise.all(batchPromises);

      for (const block of blocks) {
        console.log(
          `[INFO] Processing block ${block.number} with ${block.transactions.length} transactions...`
        );
        if (!block || !block.transactions) {
          continue;
        }

        for (const txHash of block.transactions) {
          const transaction = await getTransactionDetails(txHash);
          if (!transaction) continue;

          if (transaction.to === CONTRACT_ADDRESS) {
            console.log(`[MATCH] TX ${txHash} is sent to contract ${CONTRACT_ADDRESS}`);

            if (!addresses.has(transaction.from)) {
              console.log(`[NEW ADDRESS] ${transaction.from} interacted with contract. Saving...`);
              writeStream.write(`[${new Date().toISOString()}] ${transaction.from}\n`);
              addresses.add(transaction.from);
            } else {
              console.log(`[SKIP] Address ${transaction.from} already recorded.`);
            }
          }
          await sleep(200); // Prevent RPC overload
        }
      }
    }

    console.log("\n✅ [SUCCESS] Finished processing all blocks.");
    writeStream.close();
  } catch (err) {
    console.error("\n⛔ [ERROR] Fatal error in processing blocks:", err);
  }
}

processBlocks();
