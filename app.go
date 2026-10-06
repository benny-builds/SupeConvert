package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	_ "image/gif"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"sync"

	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"

	"github.com/disintegration/imaging"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"supeconvert/internal/engine"
	"supeconvert/internal/engine/actions"
	"supeconvert/internal/fileutil"
	"supeconvert/internal/metadata"
)

// App struct
type App struct {
	ctx      context.Context
	pipeline *engine.Pipeline
	mu       sync.Mutex
}

// ActionDTO for frontend representation
type ActionDTO struct {
	Index  int             `json:"index"`
	Type   string          `json:"type"`
	Params json.RawMessage `json:"params"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		pipeline: engine.NewPipeline(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectInputFiles opens native open file dialog for images
func (a *App) SelectInputFiles() ([]string, error) {
	files, err := runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Images",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "All Supported Images (*.jpg, *.png, *.webp, *.bmp, *.tiff, *.gif, *.svg, *.ico, *.tga, *.psd, *.avif, *.heic, *.raw, ...)",
				Pattern:     "*.jpg;*.jpeg;*.jpe;*.png;*.webp;*.gif;*.bmp;*.dib;*.tiff;*.tif;*.svg;*.ico;*.tga;*.tpic;*.psd;*.pdd;*.dds;*.pcx;*.avif;*.heic;*.heif;*.jxl;*.cr2;*.cr3;*.nef;*.arw;*.dng;*.orf;*.rw2;*.pef;*.raf;*.srw;*.ppm;*.pgm;*.pbm;*.pnm;*.hdr;*.exr",
			},
		},
	})
	if err != nil || files == nil {
		return []string{}, err
	}
	return files, nil
}

// SelectFolder opens native directory selection dialog
func (a *App) SelectFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Directory",
	})
}

// DiscoverFolderImages scans directory for image files recursively
func (a *App) DiscoverFolderImages(folderPath string) ([]string, error) {
	if folderPath == "" {
		return []string{}, nil
	}
	return fileutil.DiscoverImages(folderPath, true)
}

func unmarshalAction(actionType string, paramsJson string) (engine.Action, error) {
	switch actionType {
	case "Resize":
		var r actions.ResizeAction
		if err := json.Unmarshal([]byte(paramsJson), &r); err != nil {
			return nil, fmt.Errorf("invalid resize params: %w", err)
		}
		return &r, nil
	case "Rotate":
		var rot actions.RotateAction
		if err := json.Unmarshal([]byte(paramsJson), &rot); err != nil {
			return nil, fmt.Errorf("invalid rotate params: %w", err)
		}
		return &rot, nil
	case "Crop":
		var c actions.CropAction
		if err := json.Unmarshal([]byte(paramsJson), &c); err != nil {
			return nil, fmt.Errorf("invalid crop params: %w", err)
		}
		return &c, nil
	case "Watermark":
		var w actions.WatermarkAction
		if err := json.Unmarshal([]byte(paramsJson), &w); err != nil {
			return nil, fmt.Errorf("invalid watermark params: %w", err)
		}
		return &w, nil
	case "ColorAdjust":
		var ca actions.ColorAdjustAction
		if err := json.Unmarshal([]byte(paramsJson), &ca); err != nil {
			return nil, fmt.Errorf("invalid color adjust params: %w", err)
		}
		return &ca, nil
	case "ConvertFormat":
		var conv actions.ConvertFormatAction
		if err := json.Unmarshal([]byte(paramsJson), &conv); err != nil {
			return nil, fmt.Errorf("invalid convert format params: %w", err)
		}
		return &conv, nil
	default:
		return nil, fmt.Errorf("unknown action type: %s", actionType)
	}
}

// AddAction adds a transformation step to the pipeline
func (a *App) AddAction(actionType string, paramsJson string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	act, err := unmarshalAction(actionType, paramsJson)
	if err != nil {
		return err
	}

	a.pipeline.AddAction(act)
	return nil
}

// UpdateAction replaces an existing action at index in-place
func (a *App) UpdateAction(index int, actionType string, paramsJson string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if index < 0 || index >= len(a.pipeline.Actions) {
		return fmt.Errorf("action index out of bounds")
	}

	act, err := unmarshalAction(actionType, paramsJson)
	if err != nil {
		return err
	}

	a.pipeline.Actions[index] = act
	return nil
}

// RemoveAction removes an action by index
func (a *App) RemoveAction(index int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if index < 0 || index >= len(a.pipeline.Actions) {
		return fmt.Errorf("action index out of bounds")
	}
	a.pipeline.Actions = append(a.pipeline.Actions[:index], a.pipeline.Actions[index+1:]...)
	return nil
}

// ReorderActions moves an action from index to toIndex
func (a *App) ReorderActions(fromIndex, toIndex int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	n := len(a.pipeline.Actions)
	if fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n {
		return fmt.Errorf("index out of range")
	}

	act := a.pipeline.Actions[fromIndex]
	a.pipeline.Actions = append(a.pipeline.Actions[:fromIndex], a.pipeline.Actions[fromIndex+1:]...)
	a.pipeline.Actions = append(a.pipeline.Actions[:toIndex], append([]engine.Action{act}, a.pipeline.Actions[toIndex:]...)...)

	return nil
}

// ClearActions resets pipeline action queue
func (a *App) ClearActions() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.pipeline.Actions = []engine.Action{}
}

// GetActions returns current action queue for frontend
func (a *App) GetActions() ([]ActionDTO, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	result := make([]ActionDTO, 0)
	for idx, act := range a.pipeline.Actions {
		bytes, err := json.Marshal(act)
		if err != nil {
			continue
		}
		result = append(result, ActionDTO{
			Index:  idx,
			Type:   act.Name(),
			Params: json.RawMessage(bytes),
		})
	}
	return result, nil
}

// GetThumbnailPreview generates base64 data URI of image processed up to action index (-1 for original)
func (a *App) GetThumbnailPreview(filePath string, actionUpToIndex int, disabledIndices []int) (string, error) {
	img, err := imaging.Open(filePath, imaging.AutoOrientation(true))
	if err != nil {
		return "", fmt.Errorf("failed to open image: %w", err)
	}

	// Downscale for fast UI preview (max 800px)
	img = imaging.Fit(img, 800, 800, imaging.Lanczos)

	a.mu.Lock()
	actionsToApply := a.pipeline.Actions
	a.mu.Unlock()

	disabledMap := make(map[int]bool)
	for _, idx := range disabledIndices {
		disabledMap[idx] = true
	}

	var actionsSlice []engine.Action
	if actionUpToIndex >= 0 {
		for idx, act := range actionsToApply {
			if idx > actionUpToIndex {
				break
			}
			if !disabledMap[idx] {
				actionsSlice = append(actionsSlice, act)
			}
		}
	}

	var processed = img
	for _, act := range actionsSlice {
		processed, err = act.Apply(processed)
		if err != nil {
			return "", fmt.Errorf("preview action error: %w", err)
		}
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, processed, &jpeg.Options{Quality: 82}); err != nil {
		if err := png.Encode(&buf, processed); err != nil {
			return "", err
		}
		encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
		return "data:image/png;base64," + encoded, nil
	}

	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	return "data:image/jpeg;base64," + encoded, nil
}

// RunBatch executes pipeline processing for all input files with progress events
func (a *App) RunBatch(config engine.BatchConfig) error {
	a.mu.Lock()
	p := a.pipeline
	a.mu.Unlock()

	processor := engine.NewBatchProcessor(p)

	config.ProgressCB = func(progress engine.BatchProgress) {
		runtime.EventsEmit(a.ctx, "batch_progress", progress)
	}

	return processor.Run(config)
}

// SavePreset saves current pipeline to ./presets/ folder
func (a *App) SavePreset(presetName string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanName := strings.TrimSpace(presetName)
	if cleanName == "" {
		return "", fmt.Errorf("preset name cannot be empty")
	}

	presetDir := filepath.Join(".", "presets")
	filename := fmt.Sprintf("%s.json", strings.ToLower(strings.ReplaceAll(cleanName, " ", "_")))
	presetPath := filepath.Join(presetDir, filename)

	if err := engine.SavePreset(presetPath, cleanName, a.pipeline); err != nil {
		return "", err
	}

	return presetPath, nil
}

// LoadPreset loads pipeline actions from preset file
func (a *App) LoadPreset(presetPath string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	pipeline, _, err := engine.LoadPreset(presetPath)
	if err != nil {
		return err
	}

	a.pipeline = pipeline
	return nil
}

// DeletePreset deletes a saved preset JSON file
func (a *App) DeletePreset(presetPath string) error {
	cleanPath := filepath.Clean(presetPath)
	if !strings.HasSuffix(strings.ToLower(cleanPath), ".json") {
		return fmt.Errorf("invalid preset file")
	}
	return os.Remove(cleanPath)
}

// ListPresets returns list of saved preset JSON files
type PresetInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

func (a *App) ListPresets() ([]PresetInfo, error) {
	presetDir := filepath.Join(".", "presets")
	if err := os.MkdirAll(presetDir, 0755); err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(presetDir)
	if err != nil {
		return nil, err
	}

	list := make([]PresetInfo, 0)
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			fullPath := filepath.Join(presetDir, entry.Name())
			_, name, err := engine.LoadPreset(fullPath)
			if err == nil {
				list = append(list, PresetInfo{
					Name: name,
					Path: fullPath,
				})
			}
		}
	}
	return list, nil
}

// GetImageMetadata extracts EXIF info from file
func (a *App) GetImageMetadata(filePath string) (*metadata.ExifInfo, error) {
	return metadata.ReadExif(filePath)
}

