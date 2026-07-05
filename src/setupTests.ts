// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

import { TextDecoder, TextEncoder } from 'util';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// jsdom doesn't implement TextEncoder/TextDecoder, but cesium (pulled in via
// @map-colonies/react-components) references TextDecoder at import time.
Object.assign(global, { TextEncoder, TextDecoder });

Enzyme.configure({ adapter: new Adapter() });

// Mocked as those are used by openlayers
global.URL.createObjectURL = jest.fn();
HTMLCanvasElement.prototype.getContext = jest.fn();
