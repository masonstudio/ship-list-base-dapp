import type { Address } from "viem";

export const MAX_PROJECT_LENGTH = 48;
export const MAX_NOTE_LENGTH = 140;

export const shipListAbi = [
  {
    type: "event",
    name: "ListSaved",
    inputs: [
      { name: "listId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "projectName", type: "string", indexed: false },
      { name: "readyCount", type: "uint8", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveList",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectName", type: "string" },
      { name: "mobileReady", type: "bool" },
      { name: "contractReady", type: "bool" },
      { name: "assetsReady", type: "bool" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "listId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getList",
    stateMutability: "view",
    inputs: [{ name: "listId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "projectName", type: "string" },
      { name: "mobileReady", type: "bool" },
      { name: "contractReady", type: "bool" },
      { name: "assetsReady", type: "bool" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextListId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredShipListContractAddress =
  process.env.NEXT_PUBLIC_SHIP_LIST_CONTRACT_ADDRESS?.trim();

export const shipListContractAddress = isAddressLike(configuredShipListContractAddress)
  ? (configuredShipListContractAddress as Address)
  : undefined;
