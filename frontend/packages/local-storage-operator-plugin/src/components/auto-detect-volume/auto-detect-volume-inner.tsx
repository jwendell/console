import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, Radio } from '@patternfly/react-core';
import { ListPage } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName } from '@console/shared';
import { NodeModel } from '@console/internal/models';
import { NodesSelectionList } from '../local-volume-set/nodes-selection-list';
import { State, Action } from './state';
import { hasNoTaints, createMapForHostNames } from '../../utils';
import { nodeResource } from '../../constants/resources';
import './auto-detect-volume.scss';

export const AutoDetectVolumeInner: React.FC<AutoDetectVolumeInnerProps> = ({
  state,
  dispatch,
  taintsFilter,
}) => {
  const { t } = useTranslation();
  const [nodeData, nodeLoaded, nodeLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);

  React.useEffect(() => {
    if ((nodeLoadError || nodeData.length === 0) && nodeLoaded) {
      dispatch({ type: 'setAllNodeNamesOnADV', value: [] });
    } else if (nodeLoaded) {
      const filteredNodes = taintsFilter
        ? nodeData.filter((node) => taintsFilter(node) || hasNoTaints(node))
        : nodeData.filter(hasNoTaints);
      const names = filteredNodes.map(getName);
      const hostNames = createMapForHostNames(nodeData);
      dispatch({ type: 'setAllNodeNamesOnADV', value: names });
      dispatch({ type: 'setHostNamesMapForADV', value: hostNames });
    }
  }, [dispatch, nodeData, nodeLoaded, nodeLoadError, taintsFilter]);

  React.useEffect(() => {
    if (!state.showNodesListOnADV) {
      // explicitly needs to set this in order to make the validation works
      dispatch({ type: 'setNodeNamesForLVS', value: [] });
      dispatch({ type: 'setAllNodeNamesOnADV', value: state.allNodeNamesOnADV });
    } else {
      dispatch({ type: 'setNodeNamesForLVS', value: state.nodeNamesForLVS });
    }
    // TODO: Neha- Find out a better way
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, state.allNodeNamesOnADV, state.showNodesListOnADV]);

  const toggleShowNodesList = () => {
    dispatch({ type: 'setShowNodesListOnADV', value: !state.showNodesListOnADV });
  };

  return (
    <>
      <FormGroup
        label={t('lso-plugin~Node Selector')}
        fieldId="auto-detect-volume--radio-group-node-selector"
      >
        <div id="auto-detect-volume-radio-group-node-selector">
          <Radio
            label={t('lso-plugin~All nodes')}
            name="nodes-selection"
            id="auto-detect-volume-radio-all-nodes"
            className="auto-detect-volume__all-nodes-radio--padding"
            value="allNodes"
            onChange={toggleShowNodesList}
            description={t(
              'lso-plugin~Selecting all nodes will discover for available disks storage on all nodes.',
            )}
            checked={!state.showNodesListOnADV}
          />
          <Radio
            label={t('lso-plugin~Select nodes')}
            name="nodes-selection"
            id="auto-detect-volume-radio-select-nodes"
            value="selectedNodes"
            onChange={toggleShowNodesList}
            description={t(
              'lso-plugin~Selecting nodes allow you to limit the discovery for available disks to specific nodes.',
            )}
            checked={state.showNodesListOnADV}
          />
        </div>
      </FormGroup>
      {state.showNodesListOnADV && (
        <ListPage
          showTitle={false}
          kind={NodeModel.kind}
          ListComponent={NodesSelectionList}
          customData={{
            onRowSelected: (selectedNodes: NodeKind[]) => {
              const nodes = selectedNodes.map(getName);
              dispatch({ type: 'setNodeNamesForLVS', value: nodes });
            },
            preSelected: state.nodeNamesForLVS,
            taintsFilter,
          }}
        />
      )}
    </>
  );
};

export const AutoDetectVolumeHeader = () => {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="co-create-operand__header-text">{t('lso-plugin~Auto Detect Volume')}</h1>
      <p className="help-block">
        {t('lso-plugin~Allows you to discover the available disks on all available nodes')}
      </p>
    </>
  );
};

type AutoDetectVolumeInnerProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  taintsFilter?: (node: NodeKind) => boolean;
};
