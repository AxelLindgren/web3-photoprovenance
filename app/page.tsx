"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { keccak256, toHex } from "viem";

// PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE
const CONTRACT_ADDRESS = "0x077b8f548d36f174985a1c6339cc50bbe1c92265" as `0x${string}`;

const CONTRACT_ABI = [
  {
    inputs: [
      { name: "_photoHash", type: "bytes32" },
      { name: "_description", type: "string" },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_photoHash", type: "bytes32" }],
    name: "verify",
    outputs: [
      { name: "exists", type: "bool" },
      { name: "registrant", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "description", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function hashFile(file: File): Promise<`0x${string}`> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return keccak256(toHex(bytes));
}

export default function Home() {
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<"register" | "verify">("register");
  const [photoHash, setPhotoHash] = useState<`0x${string}` | null>(null);
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: verifyData, refetch: refetchVerify } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "verify",
    args: photoHash ? [photoHash] : undefined,
    query: { enabled: false },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const hash = await hashFile(file);
    setPhotoHash(hash);
    if (mode === "verify") {
      setTimeout(() => refetchVerify(), 100);
    }
  };

  const handleRegister = () => {
    if (!photoHash) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "register",
      args: [photoHash, description],
    });
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-bold">Photo Provenance</h1>
          <ConnectButton />
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => {
              setMode("register");
              setPhotoHash(null);
              setFileName("");
            }}
            className={`px-4 py-2 rounded ${mode === "register" ? "bg-blue-600" : "bg-gray-800"}`}
          >
            Register a photo
          </button>
          <button
            onClick={() => {
              setMode("verify");
              setPhotoHash(null);
              setFileName("");
            }}
            className={`px-4 py-2 rounded ${mode === "verify" ? "bg-blue-600" : "bg-gray-800"}`}
          >
            Verify a photo
          </button>
        </div>

        {!isConnected && mode === "register" && (
          <p className="text-yellow-400 mb-4">
            Connect your wallet to register a photo.
          </p>
        )}

        <div className="bg-gray-900 rounded p-6 mb-4">
          <label className="block mb-2 text-sm text-gray-400">
            Select a photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="block w-full text-sm text-gray-400"
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-400">File: {fileName}</p>
          )}
          {photoHash && (
            <p className="mt-2 text-xs text-gray-500 break-all">
              Hash: {photoHash}
            </p>
          )}
        </div>

        {mode === "register" && photoHash && isConnected && (
          <div className="bg-gray-900 rounded p-6">
            <label className="block mb-2 text-sm text-gray-400">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sunset over Amsterdam, taken 2026-05-27"
              className="w-full bg-gray-800 rounded px-3 py-2 mb-4"
            />
            <button
              onClick={handleRegister}
              disabled={isPending || isConfirming}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-2 rounded"
            >
              {isPending
                ? "Confirm in wallet…"
                : isConfirming
                  ? "Confirming on-chain…"
                  : "Register on-chain"}
            </button>
            {isSuccess && (
              <p className="mt-4 text-green-400">
                ✓ Registered! TX: {txHash?.slice(0, 10)}…
              </p>
            )}
          </div>
        )}

        {mode === "verify" && photoHash && (
          <div className="bg-gray-900 rounded p-6">
            {verifyData && verifyData[0] ? (
              <>
                <p className="text-green-400 font-semibold mb-3">
                  ✓ Photo is registered on-chain
                </p>
                <p className="text-sm text-gray-400">Registered by:</p>
                <p className="text-sm break-all mb-3">{verifyData[1]}</p>
                <p className="text-sm text-gray-400">At:</p>
                <p className="text-sm mb-3">
                  {new Date(Number(verifyData[2]) * 1000).toLocaleString()}
                </p>
                {verifyData[3] && (
                  <>
                    <p className="text-sm text-gray-400">Description:</p>
                    <p className="text-sm">{verifyData[3]}</p>
                  </>
                )}
              </>
            ) : verifyData ? (
              <p className="text-yellow-400">
                This photo is not registered on-chain.
              </p>
            ) : (
              <p className="text-gray-400">Checking…</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
