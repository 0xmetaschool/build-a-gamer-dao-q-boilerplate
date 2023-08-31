import { ethers } from 'ethers';

import { MerkleTree } from "merkletreejs";

export function getRoot(tree: MerkleTree): string {
  return "0x" + tree.getRoot().toString("hex");
}

export function getProof(tree: MerkleTree, leaf: string): string[] {
  return tree
    .getProof(ethers.utils.keccak256(leaf))
    .map((e: { position: "left" | "right"; data: Buffer }) => "0x" + e.data.toString("hex"));
}

export function buildTree(leaves: string[]): MerkleTree {
  return new MerkleTree(leaves, ethers.utils.keccak256, { hashLeaves: true, sortPairs: true });
}

export function addUserToTree(tree: MerkleTree, user: string): MerkleTree {
  return new MerkleTree([...tree.getLeaves(), user], ethers.utils.keccak256, {
    hashLeaves: true,
    sortPairs: true,
  });
}
