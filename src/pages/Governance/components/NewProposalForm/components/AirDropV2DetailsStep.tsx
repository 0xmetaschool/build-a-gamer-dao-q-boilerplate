
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useForm } from '@q-dev/form-hooks';
import { Calendar} from '@q-dev/q-ui-kit';
import { keccak_256 as keccak256 } from 'js-sha3';
import { MerkleTree } from 'merkletreejs';
import { NewProposalForm } from 'typings/forms';

import { FormStep } from 'components/MultiStepForm';

import { useNewProposalForm } from '../NewProposalForm';

import { required } from 'utils/validators';

import Button from 'components/Button';
import Input from 'components/Input';

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
    const leafNodes = dynamicAddresses.map(address => keccak256(address.replace('0x', '')));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const data = {
      addresses: dynamicAddresses.map((address) => address),
      leafNodes: leafNodes,
      root: merkleTree.getHexRoot(),
    };
    downloadJSON(data, "tree.json");
    return merkleTree.getHexRoot();
  };

  const form = useForm({
    initialValues: {
      rewardToken: '',
      rewardAmount: '',
      startTimestamp: null,
      endTimestamp: null
    },
    validators: {
      rewardToken: [required],
      rewardAmount: [required],
      startTimestamp: [required],
      endTimestamp: [required],
    },

    onSubmit: (form) => {
      if (dynamicAddresses.length < 2) {
        setAddressError('Please provide at least 2 addresses.');
        return; // Exit early so the form doesn't proceed
      }
      console.log('form', form);
      const merkleRoot = getMerkleRoot();
      const updatedFormValues = { ...form, merkleRoot };
      console.log('updatedFormValues', updatedFormValues);
      goNext(updatedFormValues as NewProposalForm);
    },
  });

  const handleStartDateChange = (date: Date) => {
    form.fields.startTimestamp.onChange(date.getTime().toString());
  };

  const handleEndDateChange = (date: Date) => {
    form.fields.endTimestamp.onChange(date.getTime().toString());
  };

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


      <Calendar
        value={form.fields.startTimestamp.value ? new Date(parseInt(form.fields.startTimestamp.value)) : null}
        label={t('Start time')}
        placeholder={t('Select start timestamp')}
        locale={'en-GB'}
        error={form.fields.startTimestamp.error}
        onChange={handleStartDateChange}
      />

      <Calendar
        value={form.fields.endTimestamp.value ? new Date(parseInt(form.fields.endTimestamp.value)) : null}
        label={t('End time')}
        placeholder={t('Select end timestamp')}
        locale={'en-GB'} 
        error={form.fields.endTimestamp.error}
        onChange={handleEndDateChange}
      />

    </FormStep>
  );
}

export default AirDropV2DetailsStep;
