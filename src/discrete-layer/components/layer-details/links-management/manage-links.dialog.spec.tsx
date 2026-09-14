import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import 'mutationobserver-shim';
// eslint-disable-next-line
import '../../../../__mocks__/confEnvShim';
import { Button } from '@map-colonies/react-core';
import { LinkType } from '../../../../common/models/link-type.enum';
import { ManageLinksDialog } from './manage-links.dialog';

// entity.actions.ts sits in a pre-existing circular import chain (entity.actions -> userStore ->
// RootStore -> actionDispatcherStore -> entity.actions) that webpack resolves fine via live
// bindings in the real app, but which crashes Jest's CJS module loader once a single file (this
// dialog) imports from both entity.actions and models. Stub it with just what the dialog needs.
jest.mock('../../../../common/actions/entity.actions', () => ({
  __esModule: true,
  default: [],
  LinksManagementAction: { captureThumbnail: 'ManageLinks.captureThumbnail' },
}));

const CAPTURE_THUMBNAIL_ACTION = 'ManageLinks.captureThumbnail';

global.MutationObserver = window.MutationObserver;

// Enzyme doesn't work properly with hooks in general, especially for `shallow` so this is the way to mock `react-intl` module.
jest.mock('react-intl', () => {
  /* eslint-disable */
  const reactIntl = jest.requireActual('react-intl');
  const MESSAGES = jest.requireActual('../../../../common/i18n');
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

const mockDispatchAction = jest.fn();
const mockSetDraftLink = jest.fn();
const mockRemoveDraftLink = jest.fn();
const mockClearDraftLinks = jest.fn();
const mockSetQuery = jest.fn();
const mockMutateUpdateMetadata = jest.fn().mockReturnValue('mutation-query');

let mockDraftLinks: Record<string, { protocol: LinkType; dataUrl: string; fileName?: string }> = {};
let mockUseQueryResult: { loading: boolean; data: unknown; error: unknown; setQuery: jest.Mock } = {
  loading: false,
  data: undefined,
  error: undefined,
  setQuery: mockSetQuery,
};

jest.mock('../../../models', () => {
  /* eslint-disable */
  const actual = jest.requireActual('../../../models');
  return {
    ...actual,
    useStore: () => ({
      discreteLayersStore: {
        get draftLinks() {
          return mockDraftLinks;
        },
        setDraftLink: mockSetDraftLink,
        removeDraftLink: mockRemoveDraftLink,
        clearDraftLinks: mockClearDraftLinks,
      },
      actionDispatcherStore: { dispatchAction: mockDispatchAction },
      mutateUpdateMetadata: mockMutateUpdateMetadata,
    }),
    useQuery: () => mockUseQueryResult,
  };
  /* eslint-enable */
});

const onSetOpen = jest.fn();

const layerRecord = {
  id: 'layer-1',
  type: 'RECORD_RASTER',
  links: [
    {
      protocol: LinkType.THUMBNAIL_S,
      url: 'https://example.com/small.png',
      name: undefined,
      description: undefined,
    },
    {
      protocol: LinkType.WMTS,
      url: 'https://example.com/wmts',
      name: 'wmts',
      description: undefined,
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('ManageLinksDialog', () => {
  beforeEach(() => {
    mockDraftLinks = {};
    mockUseQueryResult = {
      loading: false,
      data: undefined,
      error: undefined,
      setQuery: mockSetQuery,
    };
    jest.clearAllMocks();
    mockMutateUpdateMetadata.mockReturnValue('mutation-query');
  });

  const getButtonByMessageId = (wrapper: ShallowWrapper, id: string): ShallowWrapper => {
    return wrapper.findWhere((n) => {
      return (
        n.type() === Button &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        n.find({ id }).length > 0
      );
    });
  };

  it('renders the existing small thumbnail from links', () => {
    const wrapper = shallow(
      <ManageLinksDialog isOpen={true} onSetOpen={onSetOpen} layerRecord={layerRecord} />
    );

    const img = wrapper.find('img').at(0);
    expect(img.prop('src')).toContain('https://example.com/small.png');
  });

  // Three behaviors aren't exercised here and are covered by manual testing instead:
  // - the mount-on-open draft-clearing effect, and
  // - the mutation-success effect (dialog close + SYSTEM_CALLBACK_EDIT dispatch),
  //   both living in useEffect, which Enzyme's `shallow` never runs (`mount` outright throws
  //   under this repo's React 18 + enzyme-adapter-react-16 combination);
  // - expanding the collapsed Legend/Documentation sections via the header's onClick, since the
  //   resulting setState is confirmed to run (the handler fires with the right section) but the
  //   shallow wrapper never reflects it after `.update()` under the same version mismatch —
  //   the same class of hook/Enzyme limitation already called out in bbox.dialog.spec.tsx.

  it('capturing a thumbnail dispatches the capture action with the correct size', () => {
    const wrapper = shallow(
      <ManageLinksDialog isOpen={true} onSetOpen={onSetOpen} layerRecord={layerRecord} />
    );

    getButtonByMessageId(wrapper, 'links-management.dialog.capture-btn.text')
      .first()
      .simulate('click');

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: CAPTURE_THUMBNAIL_ACTION,
        data: { size: 'SMALL' },
      })
    );
  });

  it('Save merges the draft thumbnail into links while preserving unrelated links', () => {
    mockDraftLinks = {
      [LinkType.THUMBNAIL_S]: {
        protocol: LinkType.THUMBNAIL_S,
        dataUrl: 'data:image/png;base64,NEW',
      },
    };

    const wrapper = shallow(
      <ManageLinksDialog isOpen={true} onSetOpen={onSetOpen} layerRecord={layerRecord} />
    );

    getButtonByMessageId(wrapper, 'general.confirm-btn.text').first().simulate('click');

    expect(mockMutateUpdateMetadata).toHaveBeenCalledWith({
      data: {
        id: 'layer-1',
        type: 'RECORD_RASTER',
        partialRecordData: {
          links: [
            // unrelated WMTS link preserved untouched
            {
              protocol: LinkType.WMTS,
              url: 'https://example.com/wmts',
              name: 'wmts',
              description: undefined,
            },
            // thumbnail replaced with the draft data-URL
            {
              protocol: LinkType.THUMBNAIL_S,
              url: 'data:image/png;base64,NEW',
              name: undefined,
              description: undefined,
            },
          ],
        },
      },
    });
    expect(mockSetQuery).toHaveBeenCalledWith('mutation-query');
  });

  it('Cancel clears the draft and closes without saving', () => {
    const wrapper = shallow(
      <ManageLinksDialog isOpen={true} onSetOpen={onSetOpen} layerRecord={layerRecord} />
    );

    getButtonByMessageId(wrapper, 'general.cancel-btn.text').first().simulate('click');

    expect(mockClearDraftLinks).toHaveBeenCalled();
    expect(onSetOpen).toHaveBeenCalledWith(false);
    expect(mockMutateUpdateMetadata).not.toHaveBeenCalled();
  });
});
