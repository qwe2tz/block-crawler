import { ethers } from "ethers";
import fs from "fs";


const provider = new ethers.JsonRpcProvider("https://astrosat-parachain-rpc.origin-trail.network");

const CHAIN = 'neuroweb';
const NET='testnet'
const CONTRACT_ADDRESS = "0x996eF3cfd6c788618C359Fb538D49281a0b13805";
const START_BLOCK = 7248332;
const OUTPUT_FILE = `./addresses/${CHAIN}_${NET}_addresses.txt`;
const BATCH_SIZE = 10;

const addresses = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch a block with retry mechanism
async function getBlockWithRetry(
  blockNumber,
  maxRetries = 10,
  delay = 2000
){
  let retries = 0;
  while (true) {
    try {
      const block = await provider.getBlock(blockNumber, true);
      return block
    } catch (err) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(
          `Failed to get block ${blockNumber} after ${maxRetries} retries: ${err}`
        );
      }
      console.log('Error', err);
      await sleep(delay);
    }
  }
}

// Function to fetch transaction details by hash
async function getTransactionDetails(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);

    if (tx) {
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
      };
    }
  } catch (err) {
    console.log(`Error fetching transaction ${txHash}:, err`);
  }
  return null;
}

// Main function to process blocks and transactions
async function processBlocks() {
  try {
    const latestBlock = await provider.getBlockNumber();
    console.log(`Latest block is ${latestBlock}`);

    const writeStream = fs.createWriteStream(OUTPUT_FILE, { flags: "a" });
    let lastProcessedBlock = START_BLOCK;

    for (let batchStart = START_BLOCK; batchStart <= latestBlock; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, latestBlock);

      const batchPromises = [];
      for (let blockNumber = batchStart; blockNumber <= batchEnd; blockNumber++) {
        const block = getBlockWithRetry(blockNumber);
        batchPromises.push(block);
      }

      const blocks = await Promise.all(batchPromises);

      for (const block of blocks) {
        console.log('Processing block', block.number);
        for (const tx of block.transactions) {
          console.log(`Processing transaction ${tx}`);
          const transaction = await getTransactionDetails(tx);

          if (
            transaction &&
            transaction.to &&
            transaction.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
          ) {
            console.log(`TX ${tx} is to the contract address`);

            if (addresses.includes(transaction.from.toLowerCase())) {  
              console.log(`Address ${transaction.from.toLowerCase()} is already processed`);
              continue;

            } else {
              writeStream.write(`${transaction.from.toLowerCase()}\n`);
              addresses.push(transaction.from.toLowerCase());
            }
          }
        }
        lastProcessedBlock = block.number;
      }
    }

    writeStream.write(`\nLast processed block: ${lastProcessedBlock}\n`);
    console.log("Finished processing blocks.");
    writeStream.close();
  } catch (err) {
    console.error("Error processing blocks:", err);
  }
}

processBlocks();