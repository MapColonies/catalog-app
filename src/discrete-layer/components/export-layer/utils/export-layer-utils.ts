import { Feature } from 'geojson';
import { get } from 'lodash';
import { IEnumsMapType } from '../../../../common/contexts/enumsMap.context';
import { AvailableProperties } from '../hooks/useAddFeatureWithProps';

export function sanitizeFeaturesWithProps(
  features: Feature[],
  internalPropsForDomain: Record<AvailableProperties, unknown>
): Feature[] {
  const otherValidFeatureProps = ['label'];
  const getNewFeatureProps = (
    feature: Feature
  ): Record<AvailableProperties, unknown> => {
    const internalProps = [
      ...otherValidFeatureProps,
      ...Object.keys(internalPropsForDomain),
    ].reduce(
      (props, key) => ({
        ...props,
        [key]: (get(internalPropsForDomain, key) as string | undefined) ?? '',
      }),
      {} as Record<AvailableProperties, unknown>
    );

    const featureProps = (feature.properties ?? {}) as Record<string, unknown>;
    const newFeatureProps = {} as Record<string, unknown>;

    for (const [internalPropKey, internalPropValue] of Object.entries(
      internalProps
    )) {
      newFeatureProps[internalPropKey] =
        featureProps[internalPropKey] ?? internalPropValue;
    }
    return newFeatureProps;
  };

  return features.map((feature) => ({
    ...feature,
    properties: getNewFeatureProps(feature),
  }));
}

export const getEnumRealValues = (
  enums: IEnumsMapType,
  enumName: string
): string[] => {
  const options = Object.entries(enums)
    .filter(([key, enumDescriptor]) => enumDescriptor.enumName === enumName)
    .map(([, enumProps]) => enumProps.realValue);
  return options;
};
