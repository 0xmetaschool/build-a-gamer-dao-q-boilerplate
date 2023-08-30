import { BaseContractInstance } from '@q-dev/gdk-sdk';
import AirdropV2ABI from 'artifacts/AirDropV2.json';
import BigNumber from 'bignumber.js';
import { ContractTransaction, providers, Signer } from 'ethers';
import { MerkleProofType } from 'typings/merkle';

export class AirDropV2 extends BaseContractInstance<any> {
  constructor (signer: Signer | providers.Provider, address: string) {
    super(signer, AirdropV2ABI, address);
  }

  claimReward (index: any, address: any, proof: any): Promise<ContractTransaction> {
    return this.submitTransaction(
      'claimReward',
      [index, address, proof]
    );
  }
}