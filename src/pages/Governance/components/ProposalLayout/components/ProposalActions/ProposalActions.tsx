import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DecodedData, DefaultVotingSituations } from '@q-dev/gdk-sdk';
import { Modal, Tooltip } from '@q-dev/q-ui-kit';
import { toBigNumber } from '@q-dev/utils';
import { keccak_256 as keccak256 } from 'js-sha3';
import { MerkleTree } from 'merkletreejs';
import { MerkleProofType } from 'typings/merkle';
import { ProposalBaseInfo } from 'typings/proposals';

import Button from 'components/Button';
import { ShareButton } from 'components/ShareButton';

import { useSignConstitution } from 'hooks';
import { useDaoProposals } from 'hooks/useDaoProposals';
import useProposalActionsInfo from 'hooks/useProposalActionsInfo';

import useEndTime from '../../hooks/useEndTime';

import VoteForm from './components/VoteForm';

import { useProviderStore } from 'store/provider/hooks';
import { useTransaction } from 'store/transaction/hooks';

import { claimAirdropReward } from 'contracts/helpers/airdrop-v2';

import { PROPOSAL_STATUS } from 'constants/statuses';
import { unixToDate } from 'utils/date';
interface Props {
  proposal: ProposalBaseInfo;
  title: string;
  decodedCallData: DecodedData | null;
}

function ProposalActions ({ proposal, title, decodedCallData }: Props) {
  const { t } = useTranslation();

  const { userAddress } = useProviderStore();
  const { submitTransaction } = useTransaction();
  const { voteForProposal, executeProposal } = useDaoProposals();
  const { checkIsUserCanVeto, checkIsUserCanVoting } = useProposalActionsInfo();
  const { isConstitutionSignNeeded, signConstitution, loadConstitutionData } = useSignConstitution();
  const [isUserCanVoting, setIsUserCanVoting] = useState(false);
  const [isUserCanVeto, setIsUserCanVeto] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [merkleProof, setMerkleProof] = useState<any[]>([]);
  const votingEndTime = useEndTime(unixToDate(proposal.params.votingEndTime.toString()));

  const loadPermissions = async () => {
    const [isCanVoting, isCanVeto] = await Promise.all([
      checkIsUserCanVoting(proposal.relatedExpertPanel, proposal.relatedVotingSituation),
      checkIsUserCanVeto(proposal.target)
    ]);
    setIsUserCanVoting(isCanVoting);
    setIsUserCanVeto(isCanVeto);
  };

  const isMembershipSituation = useMemo(() => {
    return proposal.relatedVotingSituation === DefaultVotingSituations.Membership;
  }, [proposal.relatedVotingSituation]);

  const isSignNeeded = useMemo(() => {
    return isMembershipSituation && isConstitutionSignNeeded;
  }, [isMembershipSituation, isConstitutionSignNeeded]);
  
  
  const verifyAddressInMerkleTree = async (address: string) => {
    // 1. Load the Merkle tree data from tree.json
    const treeData = await fetch('/src/artifacts/tree.json').then(res => res.json());
    console.log('treedata', treeData)
    const leafNodes = treeData.leafNodes;
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

    // 2. Generate a proof for the given address
    const leaf = keccak256(address.replace('0x', ''));
    const proof = merkleTree.getProof(leaf);
    const proofArray = leafNodes.map((node: any) =>
      merkleTree.getHexProof(node)
    );
    setMerkleProof(proofArray);
    // 3. Verify the proof against the Merkle root
    return merkleTree.verify(proof, leaf, treeData.root);
  };

  const canClaimAirdrop = useMemo(() => {
    // proposal should be executed
    if (proposal.votingStatus !== PROPOSAL_STATUS.executed) return false;

    return Boolean(userAddress) && verifyAddressInMerkleTree(userAddress);
  }, [proposal.votingStatus, userAddress, decodedCallData, isMembershipSituation]);

  const canExecute = useMemo(() => {
    if (proposal.votingStatus !== PROPOSAL_STATUS.passed) return false;
    if (!decodedCallData || (isMembershipSituation && decodedCallData?.functionName !== 'addMember')) return true;

    return Boolean(userAddress) && decodedCallData.arguments?.member_ === userAddress;
  }, [proposal.votingStatus, userAddress, decodedCallData, isMembershipSituation]);

  const executeOrSignConstitution = () => {
    isSignNeeded
      ? signConstitution()
      : submitTransaction({
        successMessage: t('EXECUTE_TX'),
        submitFn: () => executeProposal(proposal)
      });
  };

  useEffect(() => {
    if (isMembershipSituation) {
      loadConstitutionData();
    }
  }, [isMembershipSituation]);

  useEffect(() => {
    loadPermissions();
  }, [proposal]);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <ShareButton title={`#${proposal.id} ${title}`} url={window.location.href} />

      {proposal.votingStatus === PROPOSAL_STATUS.pending && isUserCanVoting && (
        <Button
          style={{ width: '160px' }}
          disabled={proposal.isUserVoted}
          onClick={() => setModalOpen(true)}
        >
          {proposal.isUserVoted ? t('YOU_VOTED') : t('VOTE')}
        </Button>
      )}

      {proposal.votingStatus === PROPOSAL_STATUS.executed && canClaimAirdrop && (
        <Button
          style={{ width: '160px' }}
          onClick={() => submitTransaction({
            submitFn: () => claimAirdropReward({
              index: proposal,
              address: userAddress,
              proof: merkleProof,
            }),
            successMessage: 'Airdrop claimed successfully',
            onError: (error) => {
              console.error(error);
            }
          })}
        >
          {t('CLAIM')}
        </Button>
      )}

      {proposal.votingStatus === PROPOSAL_STATUS.accepted && isUserCanVeto && (
        <Tooltip
          trigger={
            <Button
              look="danger"
              style={{ width: '160px' }}
              disabled={proposal.isUserVetoed}
              onClick={() => submitTransaction({
                successMessage: t('VETO_TX'),
                submitFn: () => voteForProposal({ type: 'veto', proposal })
              })}
            >
              {proposal.isUserVetoed ? t('YOU_VETOED') : t('VETO')}
            </Button>
          }
        >
          {t('ROOT_NODES_VETO_TIP')}
        </Tooltip>
      )}

      {canExecute && (
        <Button
          onClick={executeOrSignConstitution}
        >
          {isSignNeeded ? t('SIGN_CONSTITUTION_TO_EXECUTE') : t('EXECUTE')}
        </Button>
      )}

      <Modal
        open={modalOpen}
        title={t('VOTE')}
        tip={
          t('VOTE_MODAL_TIP', { time: votingEndTime.formatted })
        }
        onClose={() => setModalOpen(false)}
      >
        <VoteForm
          proposal={proposal}
          onSubmit={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default ProposalActions;
