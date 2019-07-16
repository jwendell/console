import { k8sCreate, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
} from '@console/knative-plugin';

interface ServerlessScaling {
  minpods: number;
  maxpods: number | '';
  concurrencytarget: number | '';
  concurrencylimit: number | '';
}

interface LimitsData {
  cpu: ResourceType;
  memory: ResourceType;
}

interface ResourceType {
  request: number;
  requestUnit: string;
  limit: number;
  limitUnit: string;
}

export const createKnativeService = (
  name: string,
  namespace: string,
  scaling: ServerlessScaling,
  limits: LimitsData,
  imageStreamName: string,
  imageStreamTag?: string,
): Promise<K8sResourceKind> => {
  const { concurrencylimit, concurrencytarget, minpods, maxpods } = scaling;
  const {
    cpu: {
      request: cpuRequest,
      requestUnit: cpuRequestUnit,
      limit: cpuLimit,
      limitUnit: cpuLimitUnit,
    },
    memory: {
      request: memoryRequest,
      requestUnit: memoryRequestUnit,
      limit: memoryLimit,
      limitUnit: memoryLimitUnit,
    },
  } = limits;
  const knativeDeployResource: K8sResourceKind = {
    kind: 'Service',
    apiVersion: 'serving.knative.dev/v1alpha1',
    metadata: {
      name,
      namespace,
    },
    spec: {
      template: {
        metadata: {
          annotations: {
            ...(concurrencytarget && {
              'autoscaling.knative.dev/target': `${concurrencytarget}`,
            }),
            ...(minpods && { 'autoscaling.knative.dev/minScale': `${minpods}` }),
            ...(maxpods && { 'autoscaling.knative.dev/maxScale': `${maxpods}` }),
          },
        },
        spec: {
          ...(concurrencylimit && { containerConcurrency: concurrencylimit }),
          container: {
            image: `${imageStreamName}${imageStreamTag ? `:${imageStreamTag}` : ''}`,
            resources: {
              ...((cpuLimit || memoryLimit) && {
                limits: {
                  ...(cpuLimit && { cpu: `${cpuLimit}${cpuLimitUnit}` }),
                  ...(memoryLimit && { memory: `${memoryLimit}${memoryLimitUnit}` }),
                },
              }),
              ...((cpuRequest || memoryRequest) && {
                requests: {
                  ...(cpuRequest && { cpu: `${cpuRequest}${cpuRequestUnit}` }),
                  ...(memoryRequest && { memory: `${memoryRequest}${memoryRequestUnit}` }),
                },
              }),
            },
          },
        },
      },
    },
  };

  return k8sCreate(ServiceModel, knativeDeployResource);
};

export const knativeServingResources = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RevisionModel),
      namespace,
      prop: 'revisions',
    },
    {
      isList: true,
      kind: referenceForModel(ConfigurationModel),
      namespace,
      prop: 'configurations',
    },
    {
      isList: true,
      kind: referenceForModel(RouteModel),
      namespace,
      prop: 'ksroutes',
    },
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'ksservices',
    },
  ];
  return knativeResource;
};
