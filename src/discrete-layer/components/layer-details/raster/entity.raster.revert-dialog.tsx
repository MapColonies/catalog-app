import React from 'react';
import { observer } from 'mobx-react';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType } from '../../../models';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useLayerActionDialog } from '../layer-action-dialog.hook';

import './entity.raster.revert-dialog.css';

// type OverlayId = 'existing' | 'backup' | 'changesArea';

// const DEFAULT_OVERLAY_VISIBILITY: Record<OverlayId, boolean> = {
//   existing: true,
//   backup: true,
//   changesArea: false,
// };

export const EntityRevertRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    // const [isExistingVisible, setIsExistingVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.existing);
    // const [isBackupVisible, setIsBackupVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.backup);
    // const [isChangesAreaVisible, setIsChangesAreaVisible] = useState(
    //   DEFAULT_OVERLAY_VISIBILITY.changesArea
    // );

    const { dialogTitleParamTranslation, closeDialog, disclaimer } = useLayerActionDialog({
      onSetOpen: props.onSetOpen,
      layerRecord: props.layerRecord,
      recordType: RecordType.RECORD_RASTER,
      disclaimerActionId: 'action.dialog.revert',
    });

    // const overlays = useMemo(
    //   () => buildRevertOverlayFeatures(props.layerRecord.footprint?.bbox),
    //   [props.layerRecord.footprint?.bbox]
    // );

    // const overlayCheckboxes: {
    //   id: OverlayId;
    //   labelId: string;
    //   checked: boolean;
    //   onChange: (checked: boolean) => void;
    //   badge: string;
    //   badgeBackground: string;
    // }[] = [
    //   {
    //     id: 'existing',
    //     labelId: 'revert.dialog.checkbox.existing.label',
    //     checked: isExistingVisible,
    //     onChange: setIsExistingVisible,
    //     badge: 'v24',
    //     badgeBackground: EXISTING_COLOR,
    //   },
    //   {
    //     id: 'backup',
    //     labelId: 'revert.dialog.checkbox.backup.label',
    //     checked: isBackupVisible,
    //     onChange: setIsBackupVisible,
    //     badge: 'v23',
    //     badgeBackground: BACKUP_COLOR,
    //   },
    //   {
    //     id: 'changesArea',
    //     labelId: 'revert.dialog.checkbox.changes-area.label',
    //     checked: isChangesAreaVisible,
    //     onChange: setIsChangesAreaVisible,
    //     badge: '394.5 קמ״ר',
    //     badgeBackground: `linear-gradient(to right, ${CHANGES_REMOVED_COLOR} 50%, ${CHANGES_ADDED_COLOR} 50%)`,
    //   },
    // ];

    // const sidePanel = (
    //   <Box className="overlayCheckboxes" role="group">
    //     {overlayCheckboxes.map((cfg) => (
    //       <Box key={cfg.id} className="overlayCheckboxRow">
    //         <Checkbox
    //           className="overlayCheckbox"
    //           label={intl.formatMessage({ id: cfg.labelId })}
    //           checked={cfg.checked}
    //           onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
    //             evt.stopPropagation();
    //             cfg.onChange(evt.currentTarget.checked);
    //           }}
    //         />
    //         <Box className="overlayCheckboxBadge" style={{ background: cfg.badgeBackground }}>
    //           {cfg.badge}
    //         </Box>
    //       </Box>
    //     ))}
    //   </Box>
    // );

    // const mapChildren = (
    //   <>
    //     {isExistingVisible && (
    //       <VectorLayer options={{ zIndex: REVERT_OVERLAY_ZINDEX.EXISTING }}>
    //         <VectorSource>
    //           <GeoJSONFeature
    //             geometry={overlays.existing}
    //             featureStyle={EXISTING_STYLE}
    //             fit={false}
    //           />
    //         </VectorSource>
    //       </VectorLayer>
    //     )}
    //     {isBackupVisible && (
    //       <VectorLayer options={{ zIndex: REVERT_OVERLAY_ZINDEX.BACKUP }}>
    //         <VectorSource>
    //           <GeoJSONFeature geometry={overlays.backup} featureStyle={BACKUP_STYLE} fit={false} />
    //         </VectorSource>
    //       </VectorLayer>
    //     )}
    //     {isChangesAreaVisible && (
    //       <VectorLayer options={{ zIndex: REVERT_OVERLAY_ZINDEX.CHANGES_AREA }}>
    //         <VectorSource>
    //           {overlays.changesAdded && (
    //             <GeoJSONFeature
    //               geometry={overlays.changesAdded}
    //               featureStyle={CHANGES_ADDED_STYLE}
    //               fit={false}
    //             />
    //           )}
    //           {overlays.changesRemoved && (
    //             <GeoJSONFeature
    //               geometry={overlays.changesRemoved}
    //               featureStyle={CHANGES_REMOVED_STYLE}
    //               fit={false}
    //             />
    //           )}
    //         </VectorSource>
    //       </VectorLayer>
    //     )}
    //   </>
    // );

    const revertLayer = (approverName: string, approvalCode: string): void => {
      // eslint-disable-next-line no-console
      console.log('[EntityRevertRasterDialog] mock revert submit', {
        id: props.layerRecord.id,
        type: props.layerRecord.type as RecordType,
        approverName,
        approvalCode,
      });
      props.onSuccess?.();
      props.onSetOpen(false);
    };

    // const map = (
    //   <ActionMap
    //     layerRecord={props.layerRecord}
    //     style={{ height: '100%' }}
    //     defaultShowBaseMap={true}
    //     toggleBaseMap={false}
    //   >
    //     {mapChildren}
    //   </ActionMap>
    // );

    return (
      <DestructiveActionDialog
        elementId="rasterRevertDialog"
        action={Mode.REVERT}
        isOpen={props.isOpen}
        layerRecord={props.layerRecord}
        dialogTitleParamTranslation={dialogTitleParamTranslation}
        disclaimer={disclaimer}
        onClose={closeDialog}
        onSubmit={revertLayer}
        loading={false}
        error={null}
        // map={map}
        map={
          <Box style={{ height: '100%', backgroundColor: 'lightgray', color: 'red' }}>
            MAP PLACEHOLDER
          </Box>
        }
        // sidePanel={sidePanel}
        sidePanel={
          <Box style={{ width: '100%', height: '25%', backgroundColor: 'lightgray', color: 'red' }}>
            SWITCHES PLACEHOLDER
          </Box>
        }
      />
    );
  }
);
