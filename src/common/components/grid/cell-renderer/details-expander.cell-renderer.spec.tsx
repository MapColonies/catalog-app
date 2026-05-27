import React from 'react';
import { shallow } from 'enzyme';
import {
  ICellRendererParams,
  Column,
  RowNode,
  GridApi,
  ColumnApi,
  IRowNode,
} from 'ag-grid-community';
// eslint-disable-next-line
import '../../../../__mocks__/confEnvShim';
import { DetailsExpanderRenderer } from './details-expander.cell-renderer';

const ID = '1';
/* eslint-disable */
const mockDataBase: ICellRendererParams = {
  value: '',
  valueFormatted: null,
  getValue: () => {},
  setValue: () => {},
  formatValue: () => {},
  data: {
    isDetailsExpanded: false,
    id: ID,
  },
  node: {
    ...new RowNode(),
    setDataValue: (propName: string, val: any) => {},
  } as any,
  colDef: {},
  $scope: null,
  rowIndex: 1,
  api: {
    resetRowHeights: () => {},
    getRowNode: (id: string): IRowNode<any> | undefined => {
      return undefined;
    },
  },
  context: null,
  refreshCell: () => {},
  eGridCell: document.createElement('span'),
  eParentOfValue: document.createElement('span'),
  addRenderedRowListener: () => {},
};
/* eslint-enable */

describe('AgGrid DetailsExpanderRenderer component', () => {
  it('renders correctly', () => {
    const mockData = {
      ...mockDataBase,
    };

    const wrapper = shallow(<DetailsExpanderRenderer {...mockData} />);

    expect(wrapper).toMatchSnapshot();
  });

  it('when component clicked, isDetailsExpanded is toggled on the current node', () => {
    const mockData = {
      ...mockDataBase,
    };

    const spySetDataValue = jest.spyOn(mockData.node, 'setDataValue').mockImplementation(() => {});
    const spyResetRowHeights = jest
      .spyOn(mockData.api, 'resetRowHeights')
      .mockImplementation(() => {});

    const wrapper = shallow(<DetailsExpanderRenderer {...mockData} />);

    const iconContainer = wrapper.find('CollapseButton');
    iconContainer.simulate('click');
    expect(spySetDataValue).toHaveBeenCalledWith('isDetailsExpanded', true);
    expect(spyResetRowHeights).toHaveBeenCalledTimes(1);
  });
});
