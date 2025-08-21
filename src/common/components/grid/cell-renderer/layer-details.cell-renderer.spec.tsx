import React from 'react';
import { shallow } from 'enzyme';
import { ICellRendererParams, Column, RowNode, GridApi, ColumnApi } from 'ag-grid-community';
import timezoneMock from 'timezone-mock';
// eslint-disable-next-line
import '../../../../__mocks__/confEnvShim';
import { LayerDetailsRenderer } from './layer-details.cell-renderer';

/* eslint-disable */
const mockDataBase:ICellRendererParams = {
  value: '',
  valueFormatted: null,
  getValue: () => {},
  setValue: () => {},
  formatValue: () => {},
  data: {
    name: '',
    creationDate: new Date('2020-12-06T13:39:55.400Z'),
  } as any,
  node: new RowNode(),
  colDef: {},
  $scope: null,
  rowIndex: 1,
  context: null,
  refreshCell: () => {},
  eGridCell: document.createElement('span'),
  eParentOfValue: document.createElement('span'),
  addRenderedRowListener: () => {},
};
/* eslint-enable */

const NUM_SPAN_PER_FIELD = 2;
const NUM_FIEDLS = 10;

describe('AgGrid LayerDetailsRenderer component', () => {
  beforeAll(() => {
    timezoneMock.register('US/Eastern');
  });

  it('renders correctly', () => {
    const mockData = {
      ...mockDataBase
    };

    const wrapper = shallow(
      <LayerDetailsRenderer {...mockData} />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('data fields presented as TOTAL_PARTS = NUM_SPAN_PER_FIELD * NUM_FIEDLS', () => {
    const mockData = {
      ...mockDataBase
    };

    const wrapper = shallow(
      <LayerDetailsRenderer {...mockData} />
    );

    const spans = wrapper.find('span');
    expect(spans).toHaveLength(NUM_SPAN_PER_FIELD * NUM_FIEDLS);
  });
  afterAll(() => {
    timezoneMock.unregister();
  });
});
