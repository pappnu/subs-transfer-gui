import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import { VList, type VListHandle } from "virtua";
import { Checkbox } from "../components/Checkbox";
import { DraggableFileListItem } from "../components/DraggableFileListItem";
import { MultiTextInput } from "../components/MultiTextInput";
import { usePersistedState } from "../hooks/usePersistedState";
import styles from "../styles/home.module.css";
import { cancelTransfer, transferSubtitles } from "../tauri/commands";
import { removeItem } from "../utils/arraysAndObjects";
import { getFilename } from "../utils/path";

interface FileInfo {
  id: number;
  name: string;
  path: string;
}

let nextPathId = Number.MIN_SAFE_INTEGER;

export function Home() {
  const [sourcePaths, setSourcePaths] = useState<FileInfo[]>([]);
  const [targetPaths, setTargetPaths] = useState<FileInfo[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const logRef = useRef<VListHandle>(null);

  // settings
  const [runSushi, setRunSushi] = usePersistedState<boolean>("runSushi", true);
  const [sushiAutoArgs, setSushiAutoArgs] = usePersistedState<boolean>(
    "sushiAutoArgs",
    true,
  );
  const [sushiAutoAudioLanguages, setSushiAutoAudioLanguages] =
    usePersistedState<string[]>("sushiAutoAudioLanguages", []);
  const [sushiAutoAudioNames, setSushiAutoAudioNames] = usePersistedState<
    string[]
  >("sushiAutoAudioNames", []);
  const [sushiAutoSubtitleLanguages, setSushiAutoSubtitleLanguages] =
    usePersistedState<string[]>("sushiAutoSubtitleLanguages", []);
  const [sushiAutoSubtitleNames, setSushiAutoSubtitleNames] = usePersistedState<
    string[]
  >("sushiAutoSubtitleNames", []);
  const [sushiArgs, setSushiArgs] = usePersistedState<string[]>(
    "sushiArgs",
    [],
  );
  const [copyFonts, setCopyFonts] = usePersistedState<boolean>(
    "copyFonts",
    true,
  );

  const [copyTargetSubtitles, setCopyTargetSubtitles] =
    usePersistedState<boolean>("copyTargetSubtitles", false);
  const [targetAudioLanguages, setTargetAudioLanguages] = usePersistedState<
    string[]
  >("targetAudioLanguages", []);
  const [targetAudioNames, setTargetAudioNames] = usePersistedState<string[]>(
    "targetAudioNames",
    [],
  );

  const [activeId, setActiveId] = useState<UniqueIdentifier>();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0.01,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (evt: DragStartEvent) => setActiveId(evt.active.id);
  const handleDragEnd = (evt: DragEndEvent) => {
    const { active, over } = evt;

    if (active.id !== over?.id) {
      const reorder = (paths: FileInfo[]) => {
        const oldIndex = paths.findIndex((path) => path.id === active.id);
        const newIndex = paths.findIndex((path) => path.id === over?.id);
        return oldIndex < 0 || newIndex < 0
          ? paths
          : arrayMove(paths, oldIndex, newIndex);
      };
      setSourcePaths(reorder);
      setTargetPaths(reorder);
    }

    setActiveId(undefined);
  };

  useEffect(() => {
    if (!isTauri()) return;

    const unlistenFunc = listen<string>("transfer-status", (evt) =>
      setLog((prevState) => [...prevState, evt.payload]),
    );
    return () => {
      unlistenFunc.then((func) => func());
    };
  }, []);

  useEffect(() => {
    if (log.length > 0) {
      logRef.current?.scrollToIndex(log.length - 1, { align: "end" });
    }
  }, [log]);

  useEffect(() => {
    if (!isTauri()) return;

    const unlistenPromise = getCurrentWindow().onDragDropEvent((evt) => {
      if (evt.payload.type === "drop") {
        console.log(evt.payload.paths);
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className={styles.home__container}>
      <section className={styles.home__controls}>
        <header className={styles.home__header}>
          <div>
            <h1>Transfer</h1>
          </div>
          <button
            className={processing ? styles.buttonDanger : styles.buttonPrimary}
            onClick={async () => {
              if (processing) {
                await cancelTransfer();
              } else {
                setProcessing(true);
                for (let i = 0; i < sourcePaths.length; i++) {
                  await transferSubtitles({
                    sourcePath: sourcePaths[i].path,
                    targetPath: targetPaths[i].path,
                    copyFonts,
                    excludeTargetAudioLanguages: [],
                    includeTargetAudioLanguages: targetAudioLanguages,
                    copyTargetSubtitles,
                    sushi: runSushi,
                    sushiArgs,
                    sushiAudioLanguages: sushiAutoAudioLanguages,
                    sushiAudioNames: sushiAutoAudioNames,
                    sushiAutoArgs,
                    sushiSubtitleLanguages: sushiAutoSubtitleLanguages,
                    sushiSubtitleNames: sushiAutoSubtitleNames,
                  });
                }
              }
              setProcessing(false);
            }}
          >
            {processing ? "Stop transfer" : "Start transfer"}
          </button>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(undefined)}
        >
          <div className={styles.fileLists}>
            <section className={styles.fileListSection}>
              <div className={styles.sectionHeader}>
                <h2>Sources</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={async () => {
                      const paths = await open({
                        multiple: true,
                        directory: false,
                      });
                      if (paths)
                        setSourcePaths((prevState) => [
                          ...prevState,
                          ...paths.map((path) => ({
                            id: nextPathId++,
                            name: getFilename(path),
                            path,
                          })),
                        ]);
                    }}
                  >
                    Add files
                  </button>
                  <button
                    className={styles.buttonQuiet}
                    disabled={sourcePaths.length === 0}
                    onClick={() => setSourcePaths([])}
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <SortableContext
                items={sourcePaths.map(({ id }) => id)}
                strategy={verticalListSortingStrategy}
              >
                <ol className={styles.fileList}>
                  {sourcePaths.map((file) => (
                    <DraggableFileListItem
                      key={file.id}
                      sortableId={file.id}
                      liProps={{ title: file.path }}
                      buttonProps={{
                        className: styles.removeButton,
                        onClick: () =>
                          setSourcePaths((prevState) =>
                            removeItem([...prevState], file),
                          ),
                      }}
                    >
                      {file.name}
                    </DraggableFileListItem>
                  ))}
                  {sourcePaths.length === 0 && (
                    <li className={styles.emptyList}>No source files</li>
                  )}
                </ol>
              </SortableContext>
            </section>

            <section className={styles.fileListSection}>
              <div className={styles.sectionHeader}>
                <h2>Targets</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={async () => {
                      const paths = await open({
                        multiple: true,
                        directory: false,
                      });
                      if (paths)
                        setTargetPaths((prevState) => [
                          ...prevState,
                          ...paths.map((path) => ({
                            id: nextPathId++,
                            name: getFilename(path),
                            path,
                          })),
                        ]);
                    }}
                  >
                    Add files
                  </button>
                  <button
                    className={styles.buttonQuiet}
                    disabled={targetPaths.length === 0}
                    onClick={() => setTargetPaths([])}
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <SortableContext
                items={targetPaths.map(({ id }) => id)}
                strategy={verticalListSortingStrategy}
              >
                <ol className={styles.fileList}>
                  {targetPaths.map((file) => (
                    <DraggableFileListItem
                      key={file.id}
                      sortableId={file.id}
                      liProps={{ title: file.path }}
                      buttonProps={{
                        className: styles.removeButton,
                        onClick: () =>
                          setTargetPaths((prevState) =>
                            removeItem([...prevState], file),
                          ),
                      }}
                    >
                      {file.name}
                    </DraggableFileListItem>
                  ))}
                  {targetPaths.length === 0 && (
                    <li className={styles.emptyList}>No target files</li>
                  )}
                </ol>
              </SortableContext>
            </section>
          </div>
          <DragOverlay>
            {activeId !== undefined && (
              <div className={styles.dragOverlay}>
                {
                  [...sourcePaths, ...targetPaths].find(
                    (file) => file.id === activeId,
                  )?.name
                }
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <div className={styles.settingsGrid}>
          <section className={styles.settingsSection}>
            <h2>Sushi</h2>
            <Checkbox
              label="Run Sushi"
              value={runSushi}
              setValue={setRunSushi}
            />
            <Checkbox
              label="Auto args"
              value={sushiAutoArgs}
              setValue={setSushiAutoArgs}
            />
            <MultiTextInput
              label="Audio languages to seek"
              values={sushiAutoAudioLanguages}
              setValues={setSushiAutoAudioLanguages}
            />
            <MultiTextInput
              label="Audio names to seek"
              values={sushiAutoAudioNames}
              setValues={setSushiAutoAudioNames}
            />
            <MultiTextInput
              label="Subtitle languages to seek"
              values={sushiAutoSubtitleLanguages}
              setValues={setSushiAutoSubtitleLanguages}
            />
            <MultiTextInput
              label="Subtitle names to seek"
              values={sushiAutoSubtitleNames}
              setValues={setSushiAutoSubtitleNames}
            />
            <MultiTextInput
              label="Sushi arguments"
              values={sushiArgs}
              setValues={setSushiArgs}
            />
          </section>
          <section className={styles.settingsSection}>
            <h2>Multiplexing</h2>
            <Checkbox
              label="Copy source fonts"
              value={copyFonts}
              setValue={setCopyFonts}
            />
            <Checkbox
              label="Copy target subtitles"
              value={copyTargetSubtitles}
              setValue={setCopyTargetSubtitles}
            />
            <MultiTextInput
              label="Copy target audio languages"
              values={targetAudioLanguages}
              setValues={setTargetAudioLanguages}
            />
            <MultiTextInput
              label="Copy target audio names"
              values={targetAudioNames}
              setValues={setTargetAudioNames}
            />
          </section>
        </div>
      </section>

      <section className={styles.home__log} aria-label="Transfer log">
        <header className={styles.logHeader}>
          <div>
            <h2>Log</h2>
          </div>
          <button
            className={styles.buttonQuiet}
            disabled={log.length === 0}
            onClick={() => setLog([])}
          >
            Clear log
          </button>
        </header>
        <VList ref={logRef} className={styles.logList} data={log}>
          {(entry, index) => (
            <div className={styles.logEntry}>
              <span className={styles.logLineNumber}>{index + 1}</span>
              <span>{entry}</span>
            </div>
          )}
        </VList>
      </section>
    </div>
  );
}
