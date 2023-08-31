
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useForm } from '@q-dev/form-hooks';
import { Calendar} from '@q-dev/q-ui-kit';
import { keccak_256 as keccak256 } from 'js-sha3';
import { MerkleTree } from 'merkletreejs';
import { NewProposalForm } from 'typings/forms';

import Button from 'components/Button';
import Input from 'components/Input';
import { FormStep } from 'components/MultiStepForm';

import { getCurrentBlockTime } from 'helpers/blocks';
import { useNewProposalForm } from '../NewProposalForm';
import { BigNumber } from "bignumber.js";




function AirDropV2DetailsStep () {

  const { t } = useTranslation();
  const { goNext, goBack } = useNewProposalForm();

  const [dynamicAddresses, setDynamicAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  
  const addresses = [
    "0xFDDD69Dbc041DeBE65A582BF6835A7D1172E94D2",
    "0xABe215Fb79fB827978C82379d5974831E2FB5E0d",
    "0xf503808EE7d381e14B5C39C4D28947D842fD7730",
    "0x1A8a36bA1FF133bcFDD8C60bb01E511C363672B0"
  ];
  
  function toBN(value: string | number | BigNumber | bigint) {
    if (typeof value === "bigint") {
      value = value.toString();
    }
  
    return new BigNumber(value);
  }

  
  function downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.json';
    a.click();
    URL.revokeObjectURL(url);
}

  const getMerkleRoot = () => {
    const leafNodes = ['0x1A8a36bA1FF133bcFDD8C60bb01E511C363672B0', '0x1A8a36bA1FF133bcFDD8C60bb01E511C363672B0'].map((address) =>
      keccak256(
        Buffer.from(address.replace('0x', ''), 'hex'),
      ));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

    // Exporting the tree as JSON
    const data = {
      addresses: addresses.map((address) => address),
      leafNodes: leafNodes,
      root: merkleTree.getHexRoot(),
    };

    downloadJSON(data, "tree.json");
    return merkleTree.getHexRoot();
  };

  
  const form = useForm({
    initialValues: {
      rewardToken: '0x536B3cEA28f86cBb90a9F9C3934f8220f230c5Bc',
      rewardAmount: '10'
    },
    validators: {
      rewardToken: [],
      rewardAmount: []
    },


    onSubmit: async (form) => {
      // if (dynamicAddresses.length < 2) {
      //   setAddressError('Please provide at least 2 addresses.');
      //   return; // Exit early so the form doesn't proceed
      // }
      console.log('form', form);
      const merkleRoot = getMerkleRoot();

      const startTimestamp = toBN(await getCurrentBlockTime())
      .plus(500)
      .toString()
;
      const endTimestamp = toBN(await getCurrentBlockTime())
      .plus(1000)
      .toString()
;
      const updatedFormValues = { ...form, merkleRoot, startTimestamp, endTimestamp};

      console.log('updatedFormValues', updatedFormValues);
      goNext(updatedFormValues as NewProposalForm);
    },
  });

  return (
    <FormStep
      disabled={!form.isValid}
      onNext={form.submit}
      onBack={goBack}
    >

      <Input
        value={form.fields.rewardToken.value || ''}
        label={t('Reward Token Address')}
        placeholder={t('Enter reward token address')}
        onChange={form.fields.rewardToken.onChange}
        error={form.fields.rewardToken.error}
      />

      <Input
        value={form.fields.rewardAmount.value || ''}
        label={t('Reward Amount')}
        placeholder={t('Enter reward amount')}
        type="number"
        onChange={form.fields.rewardAmount.onChange}
        error={form.fields.rewardAmount.error}
      />

      {/* Dynamic addresses list */}
      {dynamicAddresses.map((address, index) => (
        <div key={index}>
          <span>{address}</span>
          {/* 4. Delete option */}
          <Button
            icon
            compact
            look="ghost"
            // className={className}
            onClick={() => {
              const newAddresses = [...dynamicAddresses];
              newAddresses.splice(index, 1);
              setDynamicAddresses(newAddresses);
            }}
          >
            Remove
          </Button>
        </div>
      ))}

      {/* 3. Input to add new address */}
      <Input
        value={newAddress}
        label={t('Enter New Address')}
        placeholder="Enter new address"
        hint={"Enter atlest 2 addresses to create a Merkle Tree"}
        onChange={value => setNewAddress(value)}
      />

      <Button
        icon
        compact
        look="ghost"
        // className={className}
        onClick={() => {
          if (newAddress) {
            setDynamicAddresses(prev => [...prev, newAddress]);
            setNewAddress(''); // Clear the input
          }
        }}
      >
        Add Address
      </Button>
      {addressError && <p style={{ color: 'red' }}>{addressError}</p>}

    </FormStep>
  );
}

export default AirDropV2DetailsStep;
