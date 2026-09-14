// eslint-disable-next-line
import '../../__mocks__/confEnvShim';
import { LinkType } from '../../common/models/link-type.enum';
import { rootStore } from './RootStore';

describe('discreteLayersStore draft links', () => {
  it('setDraftLink adds an entry for the given protocol', () => {
    const store = rootStore.create({});

    store.discreteLayersStore.setDraftLink(LinkType.THUMBNAIL_S, 'data:image/png;base64,AAA', undefined);

    expect(store.discreteLayersStore.draftLinks?.[LinkType.THUMBNAIL_S]).toEqual({
      protocol: LinkType.THUMBNAIL_S,
      dataUrl: 'data:image/png;base64,AAA',
      fileName: undefined,
    });
  });

  it('setDraftLink preserves previously set entries for other protocols', () => {
    const store = rootStore.create({});

    store.discreteLayersStore.setDraftLink(LinkType.THUMBNAIL_S, 'data:image/png;base64,AAA');
    store.discreteLayersStore.setDraftLink(LinkType.LEGEND_IMG, 'data:image/png;base64,BBB', 'legend.png');

    expect(Object.keys(store.discreteLayersStore.draftLinks ?? {})).toHaveLength(2);
    expect(store.discreteLayersStore.draftLinks?.[LinkType.THUMBNAIL_S]?.dataUrl).toBe(
      'data:image/png;base64,AAA'
    );
    expect(store.discreteLayersStore.draftLinks?.[LinkType.LEGEND_IMG]?.fileName).toBe('legend.png');
  });

  it('removeDraftLink clears only the given protocol entry', () => {
    const store = rootStore.create({});
    store.discreteLayersStore.setDraftLink(LinkType.THUMBNAIL_S, 'data:image/png;base64,AAA');
    store.discreteLayersStore.setDraftLink(LinkType.LEGEND_IMG, 'data:image/png;base64,BBB', 'legend.png');

    store.discreteLayersStore.removeDraftLink(LinkType.THUMBNAIL_S);

    expect(store.discreteLayersStore.draftLinks?.[LinkType.THUMBNAIL_S]).toBeUndefined();
    expect(store.discreteLayersStore.draftLinks?.[LinkType.LEGEND_IMG]).toBeDefined();
  });

  it('clearDraftLinks empties all draft entries', () => {
    const store = rootStore.create({});
    store.discreteLayersStore.setDraftLink(LinkType.THUMBNAIL_S, 'data:image/png;base64,AAA');
    store.discreteLayersStore.setDraftLink(LinkType.LEGEND_IMG, 'data:image/png;base64,BBB', 'legend.png');

    store.discreteLayersStore.clearDraftLinks();

    expect(store.discreteLayersStore.draftLinks).toEqual({});
  });
});
