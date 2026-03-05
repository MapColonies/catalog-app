import React from 'react';
import { shallow } from 'enzyme';
import { BBoxCorner, Corner } from './bbox-corner-indicator';

const corner = Corner.BOTTOM_LEFT;

describe('BBoxCorner component', () => {
  it('renders correctly', () => {
    const wrapper = shallow(<BBoxCorner corner={corner} />);

    expect(wrapper).toMatchSnapshot();
  });

  it('renders as DIV', () => {
    const wrapper = shallow(<BBoxCorner corner={corner} />);

    const labelContainer = wrapper.find('div');
    expect(labelContainer).toBeTruthy();
  });

  it('marks appropriate corner', () => {
    const wrapper = shallow(<BBoxCorner corner={corner} />);

    const labelContainer = wrapper.find('div.bboxLeftBottomCorner');
    expect(labelContainer).toBeTruthy();
  });

  it('render DIV with marked corner and defined css className', () => {
    const className = 'test';
    const wrapper = shallow(<BBoxCorner corner={corner} className={className} />);

    const labelContainer = wrapper.find(`div.bboxLeftBottomCorner.${className}`);
    expect(labelContainer).toBeTruthy();
  });
});
