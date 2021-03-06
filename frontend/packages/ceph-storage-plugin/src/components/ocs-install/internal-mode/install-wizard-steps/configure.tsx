import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { useFlag } from '@console/shared';
import { InternalClusterAction, InternalClusterState, ActionType } from '../reducer';
import { EncryptionFormGroup, NetworkFormGroup } from '../../install-wizard/configure';
import { NetworkType } from '../../types';
import { OCS_SUPPORT_FLAGS } from '../../../../features';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  const { networkType: nwType, publicNetwork, clusterNetwork } = state;
  const isMultusSupported = useFlag(OCS_SUPPORT_FLAGS.MULTUS);

  const setNetworkType = (networkType: NetworkType) =>
    dispatch({ type: ActionType.SET_NETWORK_TYPE, payload: networkType });

  const setNetwork = (type, payload) =>
    type === 'Cluster'
      ? dispatch({ type: ActionType.SET_CLUSTER_NETWORK, payload })
      : dispatch({ type: ActionType.SET_PUBLIC_NETWORK, payload });

  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
      {isMultusSupported && (
        <NetworkFormGroup
          setNetworkType={setNetworkType}
          setNetwork={setNetwork}
          networkType={nwType}
          publicNetwork={publicNetwork}
          clusterNetwork={clusterNetwork}
        />
      )}
    </Form>
  );
};

type ConfigureProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
  mode: string;
};
