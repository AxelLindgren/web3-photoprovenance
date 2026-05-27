# Photo Provenance

A decentralized photo provenance tool. Hash any image locally in your browser, 
then register the hash on Ethereum so you can later prove you claimed it at a 
specific moment in time — useful in an era of AI-generated images and disputed 
authorship.

## How it works

1. **Hash locally** — the photo is hashed in your browser using keccak256. 
   The file itself never leaves your device.
2. **Register on-chain** — the hash plus an optional description is stored 
   in a smart contract on Ethereum Sepolia, paired with your wallet address 
   and a block timestamp.
3. **Verify anywhere** — anyone can re-hash a photo and check the contract. 
   Matching hash → cryptographic proof of when and by whom it was claimed.

URL: photo-provenance-xyz.vercel.app