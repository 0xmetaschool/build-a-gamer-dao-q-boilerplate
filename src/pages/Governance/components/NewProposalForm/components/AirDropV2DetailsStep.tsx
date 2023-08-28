
import { useTranslation } from 'react-i18next';

import { useForm } from '@q-dev/form-hooks';
import { Calendar, Input as UiInput } from '@q-dev/q-ui-kit';
import { NewProposalForm } from 'typings/forms';

import { FormStep } from 'components/MultiStepForm';

import { useNewProposalForm } from '../NewProposalForm';

import { required } from 'utils/validators';

import { MerkleTree } from 'merkletreejs';
import { keccak_256 as keccak256 } from 'js-sha3';

function AirDropV2DetailsStep () {
  const { t } = useTranslation();
  const { goNext, goBack } = useNewProposalForm();

  const addresses = [
    "0xFDDD69Dbc041DeBE65A582BF6835A7D1172E94D2",
    "0xABe215Fb79fB827978C82379d5974831E2FB5E0d",
    "0xf503808EE7d381e14B5C39C4D28947D842fD7730",
    "0x1A8a36bA1FF133bcFDD8C60bb01E511C363672B0"
  ];

  const getMerkleRoot = () => {
    const leafNodes = addresses.map(address => keccak256(address.replace("0x", "")));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    return merkleTree.getHexRoot();
  };

  const form = useForm({
    initialValues: {
      rewardToken: '',
      rewardAmount: '',
      // merkleRoot: '',
      startTimestamp: null, // null for Date
      endTimestamp: null // null for Date
    },
    validators: {
      rewardToken: [required],
      rewardAmount: [required],
      // merkleRoot: [required],
      startTimestamp: [required],
      endTimestamp: [required],
    },
    onSubmit: (form) => {
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

      <UiInput
        value={form.fields.rewardToken.value || ''}
        label={t('REWARD_TOKEN_ADDRESS')}
        placeholder={t('Enter reward token address')}
        onChange={form.fields.rewardToken.onChange}
      />

      <UiInput
        value={form.fields.rewardAmount.value || ''}
        label={t('REWARD_AMOUNT')}
        placeholder={t('Enter reward amount')}
        type="number"
        onChange={form.fields.rewardAmount.onChange}
      />

      {/* <UiInput
        value={form.fields.merkleRoot.value || ''}
        label={t('MERKLE_ROOT')}
        placeholder={t('Enter Merkle Root')}
        onChange={form.fields.merkleRoot.onChange}
      /> */}

      <Calendar
        value={form.fields.startTimestamp.value ? new Date(parseInt(form.fields.startTimestamp.value)) : null}
        label={t('START_TIMESTAMP')}
        placeholder={t('Select start timestamp')}
        locale={'en-GB'} 
        onChange={handleStartDateChange}
      />

      <Calendar
        value={form.fields.endTimestamp.value ? new Date(parseInt(form.fields.endTimestamp.value)) : null}
        label={t('END_TIMESTAMP')}
        placeholder={t('Select end timestamp')}
        locale={'en-GB'} 
        onChange={handleEndDateChange}
      />

    </FormStep>
  );
}

export default AirDropV2DetailsStep;
