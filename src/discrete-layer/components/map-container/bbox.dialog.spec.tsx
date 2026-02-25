import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { act, waitFor } from '@testing-library/react';
import 'mutationobserver-shim';
import { Button, TextField } from '@map-colonies/react-core';
// eslint-disable-next-line
import '../../../__mocks__/confEnvShim';
import { BBoxDialog } from './bbox.dialog';

global.MutationObserver = window.MutationObserver;

const setOpenFn = jest.fn();
const polygonUpdate = jest.fn();

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

const updateField = (
  wrapper: ShallowWrapper,
  fieldName: string,
  value: number
) => {
  const fieldWrapper = wrapper.find(TextField).find({ name: fieldName });

  act(() => {
    fieldWrapper.at(0).simulate('change', {
      // simulate changing e.target.name and e.target.value
      target: {
        name: fieldName,
        value,
      },
    });
  });

  act(() => {
    fieldWrapper.simulate('blur');
  });
};

const getFieldValue = (wrapper: ShallowWrapper, fieldName: string) => {
  const field = wrapper.find(TextField).find({ name: fieldName });
  // eslint-disable-next-line
  return field.props().value;
};

/* eslint-disable */
const getButtonById = (wrapper: ShallowWrapper, id: string): ShallowWrapper => {
  return wrapper.findWhere((n) => {
    return n.type() === Button && n.prop('children').props['id'] === id;
  });
};
/* eslint-enable */

describe('BBoxDialog component', () => {
  afterEach(() => {
    setOpenFn.mockClear();
    polygonUpdate.mockClear();
  });

  it('renders correctly', () => {
    const wrapper = shallow(
      <BBoxDialog
        isOpen={false}
        onSetOpen={setOpenFn}
        onPolygonUpdate={polygonUpdate}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('BBox fields filled successfully', async () => {
    const fields = {
      bottomLeftLat: 10,
      bottomLeftLon: 10,
      topRightLat: 10,
      topRightLon: 10,
    };

    const wrapper = shallow(
      <BBoxDialog
        isOpen={false}
        onSetOpen={setOpenFn}
        onPolygonUpdate={polygonUpdate}
      />
    );

    for (const field in fields) {
      // eslint-disable-next-line
      updateField(wrapper, field, (fields as any)[field]);
    }

    await waitFor(() => {
      for (const field in fields) {
        // eslint-disable-next-line
        expect(getFieldValue(wrapper, field)).toEqual((fields as any)[field]);
      }
    });
  });

  it('Cancel button triggers dialog closing', () => {
    const wrapper = shallow(
      <BBoxDialog
        isOpen={false}
        onSetOpen={setOpenFn}
        onPolygonUpdate={polygonUpdate}
      />
    );

    getButtonById(wrapper, 'general.cancel-btn.text').simulate('click');

    expect(setOpenFn).toHaveBeenCalledWith(false);
  });

  it('Submitting the form triggers onPolygonUpdate', async () => {
    const wrapper = shallow(
      <BBoxDialog
        isOpen={false}
        onSetOpen={setOpenFn}
        onPolygonUpdate={polygonUpdate}
      />
    );

    act(() => {
      wrapper.find('form').simulate('submit');
    });

    wrapper.update();

    await waitFor(() => {
      expect(polygonUpdate).toHaveBeenCalled();
    });
  });

  //// TODO test to check error presentation logic.
  //// When component uses useFormik() hook internal formik state not updated when triggered onChange event.
  //// Probably formik should be used in component way rather than hook.
  //// Also preferable to test such functionality on the levevl of E2E tests.
  /* eslint-disable */
  // it('Bbox stays opened and shows ERROR when Y(km) limit is exceeded', async () => {
  //   const fields = {
  //     bottomLeftLat: 31,
  //     bottomLeftLon: 34,
  //     topRightLat: 32,
  //     topRightLon: 35,
  //   };
  //   .
  //   .
  //   .
  //   console.log('ERROR --->', wrapper.find('#errorContainer').length);
  //   expect(wrapper.find('#errorContainer')).toBeDefined();
  // });
  /* eslint-enable */
});
