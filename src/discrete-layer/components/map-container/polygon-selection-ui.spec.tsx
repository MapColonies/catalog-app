import React from 'react';
import { shallow } from 'enzyme';
import { DrawType } from '@map-colonies/react-components';
import { Button, Drawer, ListItemText } from '@map-colonies/react-core';
// eslint-disable-next-line
import '../../../__mocks__/confEnvShim';
import { PolygonSelectionUi } from './polygon-selection-ui';
import { BBoxDialog } from './bbox.dialog';

// Enzyme doesn’t work properly with hooks in general, especially for `shallow` so this is the way to mock `react-intl` module.
// Enspired by https://github.com/formatjs/formatjs/issues/1477
jest.mock('react-intl', () => {
  /* eslint-disable */
  const reactIntl = jest.requireActual('react-intl');
  const MESSAGES = jest.requireActual('../../../common/i18n');
  const intl = reactIntl.createIntl({
    locale: 'en',
    messages: MESSAGES.default['en'],
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
  /* eslint-enable */
});

/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unsafe-member-access */

const startDraw = jest.fn();
const cancelDraw = jest.fn();
const resetDraw = jest.fn();
const MAP_ACTION_WIDTH = '300px';

describe('Polygon Selection component', () => {
  afterEach(() => {
    startDraw.mockClear();
    cancelDraw.mockClear();
    resetDraw.mockClear();
  });

  it('renders correctly', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        isSelectionEnabled={false}
        onCancelDraw={() => {}}
        onReset={() => {}}
        onStartDraw={() => {}}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('opens the menu with drawing options on open menu button click', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        onStartDraw={startDraw}
        onCancelDraw={cancelDraw}
        onReset={resetDraw}
        isSelectionEnabled={false}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    wrapper.find(Button).simulate('click', { currentTarget: {} });

    expect(wrapper.find(Drawer).prop('open')).toBe(true);
  });

  it('Box drawing menu items call start draw with correct params on click and closes the menu', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        onStartDraw={startDraw}
        onCancelDraw={cancelDraw}
        onReset={resetDraw}
        isSelectionEnabled={false}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    const openMenuButton = wrapper.find(Button);

    openMenuButton.simulate('click', { currentTarget: {} });

    const item = wrapper.findWhere((n) => {
      return (
        n.type() === ListItemText &&
        n.prop('children').props['id'] ===
          'polygon-selection.box-menu_option.text'
      );
    });
    item.parent().simulate('click');

    expect(startDraw).toHaveBeenCalledWith(DrawType.BOX);
    expect(startDraw).toHaveBeenCalledTimes(1);
  });

  it('Custom defined Bbox drawing menu items opens BBox definition dialog on click and closes the menu', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        onStartDraw={startDraw}
        onCancelDraw={cancelDraw}
        onReset={resetDraw}
        isSelectionEnabled={false}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    const openMenuButton = wrapper.find(Button);
    openMenuButton.simulate('click', { currentTarget: {} });

    const item = wrapper.findWhere((n) => {
      return (
        n.type() === ListItemText &&
        n.prop('children').props['id'] ===
          'polygon-selection.box_coorinate-menu_option.text'
      );
    });
    item.parent().simulate('click');

    expect(wrapper.find(BBoxDialog).prop('isOpen')).toBe(true);
  });

  it('clicking the clear menu item calls onreset and closes the menu', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        onStartDraw={startDraw}
        onCancelDraw={cancelDraw}
        onReset={resetDraw}
        isSelectionEnabled={false}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    const openMenuButton = wrapper.find(Button);
    openMenuButton.simulate('click', { currentTarget: {} });

    const item = wrapper.findWhere((n) => {
      return (
        n.type() === ListItemText &&
        n.prop('children').props['id'] ===
          'polygon-selection.clear-menu_option.text'
      );
    });
    item.parent().simulate('click');

    expect(resetDraw).toHaveBeenCalledTimes(1);
  });

  it('Cancel draw is shown when IsSelectionEnabled is true, and clicking on the button calls onCancelDraw', () => {
    const wrapper = shallow(
      <PolygonSelectionUi
        onStartDraw={startDraw}
        onCancelDraw={cancelDraw}
        onReset={resetDraw}
        isSelectionEnabled={true}
        onPolygonUpdate={(polygon) => {}}
        mapActionsWidth={MAP_ACTION_WIDTH}
      />
    );

    const button = wrapper.findWhere((n) => {
      return (
        n.type() === Button &&
        n.prop('children').props['id'] === 'polygon-selection.cancel-btn.text'
      );
    });

    button.simulate('click');

    expect(cancelDraw).toHaveBeenCalledTimes(1);
  });
});
