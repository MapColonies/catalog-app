import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import {
  dateFormatter,
  FormatterFunc,
  stringFormatter,
} from '../../../helpers/formatters';

import './layer-details.cell-renderer.css';

interface DetailsProp {
  propName: string;
  propLabelId: string;
  formatter: FormatterFunc;
}

const detailsPropsLayout = new Array<DetailsProp[]>(
  [
    {
      propName: 'name',
      propLabelId: 'results.fields.name.label',
      formatter: stringFormatter,
    },
    {
      propName: 'name',
      propLabelId: 'results.fields.name.label',
      formatter: stringFormatter,
    },
    {
      propName: 'name',
      propLabelId: 'results.fields.name.label',
      formatter: stringFormatter,
    },
    {
      propName: 'name',
      propLabelId: 'results.fields.name.label',
      formatter: stringFormatter,
    },
    {
      propName: 'name',
      propLabelId: 'results.fields.name.label',
      formatter: stringFormatter,
    },
  ],
  [
    {
      propName: 'creationDate',
      propLabelId: 'results.fields.creation-date.label',
      formatter: dateFormatter,
    },
    {
      propName: 'creationDate',
      propLabelId: 'results.fields.creation-date.label',
      formatter: dateFormatter,
    },
    {
      propName: 'creationDate',
      propLabelId: 'results.fields.creation-date.label',
      formatter: dateFormatter,
    },
    {
      propName: 'creationDate',
      propLabelId: 'results.fields.creation-date.label',
      formatter: dateFormatter,
    },
    {
      propName: 'creationDate',
      propLabelId: 'results.fields.creation-date.label',
      formatter: dateFormatter,
    },
  ]
);

export const LayerDetailsRenderer: React.FC<ICellRendererParams> = (props) => {
  return (
    <Box className="layerDetailsContainer">
      {detailsPropsLayout.map((layoutColumn, i) => {
        return (
          <Box key={i} className="detailsColumn">
            {layoutColumn.map((item: DetailsProp, ii) => {
              return (
                <Box key={`${i}_${ii}`}>
                  <span style={{ fontWeight: 600 }}>
                    <FormattedMessage id={item.propLabelId} />
                    :&nbsp;
                  </span>
                  <span>
                    {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      item.formatter(props.data[item.propName])
                    }
                  </span>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};
