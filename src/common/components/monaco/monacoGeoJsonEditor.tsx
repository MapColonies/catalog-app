import { useEffect, useMemo, useState } from 'react';
import {
  EditorProps,
  Editor,
  OnChange,
  OnMount,
  BeforeMount,
  useMonaco,
} from '@monaco-editor/react';
import { LinearProgress } from '@map-colonies/react-core';
import { editor, Uri } from 'monaco-editor';
import { parseTree, findNodeAtOffset, getNodeValue } from 'jsonc-parser';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import { FEATURE_ID_FIELD, HighlightMode, MONACO_ROW_NUMBER_COLUMN } from './monaco.utils';
import { JsonSchema } from './monaco.types';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';

type MonacoGeoJSONEditorProps = EditorProps & {
  codeText?: string;
  readonly?: boolean;
  isFetching?: boolean;
  schema?: JsonSchema;
  onSelectGeometry?: (key: string) => void;
  highlightMode?: HighlightMode;
};

export const MonacoGeoJSONEditor: React.FC<MonacoGeoJSONEditorProps> = (editorProps) => {
  const {
    schema,
    readonly = false,
    isFetching = false,
    onChange,
    codeText,
    onSelectGeometry,
    highlightMode = HighlightMode.HOVER_ON_FEATTURE,
  } = editorProps;
  const [loadProgressBar, setLoadProgressBar] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');

  const monaco = useMonaco();
  //   const { isDarkMode } = useTheme();
  const isDarkMode = false;

  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly: readonly,
  };

  useEffect(() => {
    setCode(codeText as string);
  }, [codeText]);

  const diagnosticOptions = useMemo(() => {
    if (!schema) {
      return {};
    }

    const options = {
      validate: true,
      allowComments: false,
      trailingCommas: 'error',
      schemas: [
        {
          uri: schema.$id ?? 'UNKNOWN',
          schema: schema,
          fileMatch: ['*'],
        },
      ],
      schemaValidation: 'error',
    };
    return options;
  }, [schema]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    monaco.json.jsonDefaults.setDiagnosticsOptions(diagnosticOptions);

    return () => {};
  }, [monaco, diagnosticOptions]);

  const handleCodeChange: OnChange = (
    value: string | undefined,
    ev: editor.IModelContentChangedEvent
  ) => {
    const localCode = value ?? '';
    const model = monaco?.editor.getModel(schema?.$id as unknown as Uri);
    const markers = monaco?.editor
      .getModelMarkers({ resource: model?.uri })
      .filter((m) => m.severity === monaco.MarkerSeverity.Error && m.owner === 'json');
    setCode(localCode);
    try {
      const parsedJson = JSON.parse(localCode);
      if (onChange && (markers?.length === 0 || parsedJson)) {
        onChange(localCode, ev);
      }
    } catch {
      console.log('****** JSON not valid, current markers are:', markers);
    }
  };

  const getFeatureAtPosition = (
    model: editor.ITextModel,
    lineNumber: number,
    column: number
  ): Feature<Geometry, GeoJsonProperties> | null => {
    const text = model.getValue();
    const offset = model.getOffsetAt({ lineNumber, column });

    const tree = parseTree(text);
    if (!tree) return null;

    let node = findNodeAtOffset(tree, offset);
    if (!node) return null;

    while (node) {
      if (node.type === 'object') {
        const value = getNodeValue(node);
        if (value?.type === 'Feature' && value.geometry) {
          return value;
        }
      }
      node = node.parent!;
    }

    return null;
  };

  const editorDidMount: OnMount = (editor) => {
    setLoadProgressBar(false);
    editor.focus();
    editor.onMouseMove((e) => {
      if (e.target && e.target.position) {
        const { lineNumber, column } = e.target.position;
        const model = editor.getModel();

        if (column === MONACO_ROW_NUMBER_COLUMN) {
          //Hover on linenumber editor column
          onSelectGeometry?.('');
          return;
        }

        if (!model) return;

        if (highlightMode === HighlightMode.HOVER_ON_FEATTURE) {
          const feature = getFeatureAtPosition(model, lineNumber, column);

          if (!feature) return;

          const featureId = feature.properties?.[FEATURE_ID_FIELD];
          onSelectGeometry?.(featureId);
          // console.log('Hovered Feature(HOVER_ON_FEATTURE):', featureId);
        } else {
          const lineContent = model?.getLineContent(lineNumber);
          const regex = new RegExp(`"${FEATURE_ID_FIELD}":\\s*"(.*)"`); // /"id":\s*"(.*)"/;
          const match = lineContent?.match(regex);

          if (match) {
            const featureId = match[1];
            onSelectGeometry?.(featureId);
            // console.log(`Hovered Feature(HOVER_ON_KEY_FIELD): ${featureId}`);
          } else {
            onSelectGeometry?.('');
          }
        }
      }
    });
  };

  const handleBeforeMount: BeforeMount = () => {
    setLoadProgressBar(true);
  };

  return (
    <>
      {loadProgressBar && (
        <LinearProgress value={100} variant={isFetching ? 'indeterminate' : 'determinate'} />
      )}
      <Editor
        width={'100%'}
        defaultLanguage={'json'}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        value={code}
        options={options}
        {...editorProps}
        onChange={handleCodeChange}
        onMount={editorDidMount}
        beforeMount={handleBeforeMount}
      />
    </>
  );
};
