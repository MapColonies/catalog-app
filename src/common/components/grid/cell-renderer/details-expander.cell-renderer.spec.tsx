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
import { DETAILS_ROW_ID_SUFFIX } from '../grid';
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
    isVisible: true,
    id: ID,
  },
  node: new RowNode(),
  colDef: {},
  $scope: null,
  rowIndex: 1,
  api: {
    onFilterChanged: () => {},
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

  it('when component clicked detail row was found in grid rowdata', () => {
    const mockData = {
      ...mockDataBase,
    };

    // eslint-disable-next-line
    jest.spyOn(mockData.api, 'onFilterChanged').mockImplementation(() => {});
    const spyGetRonNode = jest
      .spyOn(mockData.api, 'getRowNode')
      .mockImplementation(() => {
        const val = new RowNode();
        // eslint-disable-next-line
        val.setDataValue = (propName, val) => {};
        val.data = {
          isVisible: false,
        };
        return val;
      });

    const wrapper = shallow(<DetailsExpanderRenderer {...mockData} />);

    const iconContainer = wrapper.find('CollapseButton');
    iconContainer.simulate('click');
    expect(spyGetRonNode).toHaveBeenCalledWith(`${ID}${DETAILS_ROW_ID_SUFFIX}`);
  });
});
