package engine

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"

	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
	"supeconvert/internal/engine/actions"
	"supeconvert/internal/fileutil"
	"supeconvert/internal/naming"
)

type BatchProgress struct {
	CurrentFile string `json:"current_file"`
	Index       int    `json:"index"`
	Total       int    `json:"total"`
	Success     int32  `json:"success"`
	Failed      int32  `json:"failed"`
	ErrorMsg    string `json:"error_msg,omitempty"`
}

type BatchProgressCallback func(progress BatchProgress)

type BatchConfig struct {
	InputPaths      []string              `json:"input_paths"`
	InputDir        string                `json:"input_dir"`
	OutputDir       string                `json:"output_dir"`
	Recursive       bool                  `json:"recursive"`
	NamingPattern   string                `json:"naming_pattern"`
	TargetFormat    string                `json:"target_format"`
	Quality         int                   `json:"quality"`
	Workers         int                   `json:"workers"`
	DisabledIndices []int                 `json:"disabled_indices"`
	ProgressCB      BatchProgressCallback `json:"-"`
}

type BatchProcessor struct {
	pipeline *Pipeline
}

func NewBatchProcessor(p *Pipeline) *BatchProcessor {
	return &BatchProcessor{pipeline: p}
}

func (bp *BatchProcessor) Run(config BatchConfig) error {
	var files []string

	if len(config.InputPaths) > 0 {
		for _, p := range config.InputPaths {
			if fileutil.IsImageFile(p) {
				files = append(files, p)
			}
		}
	} else if config.InputDir != "" {
		discovered, err := fileutil.DiscoverImages(config.InputDir, config.Recursive)
		if err != nil {
			return fmt.Errorf("failed to discover images: %w", err)
		}
		files = discovered
	}

	if len(files) == 0 {
		return fmt.Errorf("no valid image files found")
	}

	if err := os.MkdirAll(config.OutputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	workers := config.Workers
	if workers <= 0 {
		workers = runtime.NumCPU()
	}

	// Detect target format & quality from pipeline actions if not set explicitly
	targetFormat := strings.ToLower(config.TargetFormat)
	quality := config.Quality
	if quality <= 0 {
		quality = 85
	}

	if bp.pipeline != nil {
		for _, action := range bp.pipeline.Actions {
			if convertAct, ok := action.(*actions.ConvertFormatAction); ok {
				if targetFormat == "" {
					targetFormat = convertAct.TargetFormat
				}
				if config.Quality <= 0 && convertAct.Quality > 0 {
					quality = convertAct.Quality
				}
			}
		}
	}

	if config.NamingPattern == "" {
		config.NamingPattern = "{name}.{ext}"
	}

	type job struct {
		index int
		path  string
	}

	jobs := make(chan job, len(files))
	for i, f := range files {
		jobs <- job{index: i + 1, path: f}
	}
	close(jobs)

	var successCount int32
	var failedCount int32
	var wg sync.WaitGroup

	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				err := bp.processSingleFile(j.path, j.index, config, targetFormat, quality)

				var errStr string
				if err != nil {
					atomic.AddInt32(&failedCount, 1)
					errStr = err.Error()
				} else {
					atomic.AddInt32(&successCount, 1)
				}

				completed := int(atomic.LoadInt32(&successCount) + atomic.LoadInt32(&failedCount))
				if config.ProgressCB != nil {
					config.ProgressCB(BatchProgress{
						CurrentFile: j.path,
						Index:       completed,
						Total:       len(files),
						Success:     atomic.LoadInt32(&successCount),
						Failed:      atomic.LoadInt32(&failedCount),
						ErrorMsg:    errStr,
					})
				}
			}
		}()
	}

	wg.Wait()
	return nil
}

func (bp *BatchProcessor) processSingleFile(inputPath string, index int, config BatchConfig, targetFormat string, quality int) error {
	img, err := imaging.Open(inputPath, imaging.AutoOrientation(true))
	if err != nil {
		if globalMagickEngine.IsAvailable() {
			outFilename := naming.FormatFilename(config.NamingPattern, naming.Options{
				OriginalPath: inputPath,
				Width:        0,
				Height:       0,
				Index:        index,
				TargetFormat: targetFormat,
			})
			outputPath := filepath.Join(config.OutputDir, outFilename)
			return globalMagickEngine.Convert(inputPath, outputPath, quality, 0, 0)
		}
		return fmt.Errorf("open error: %w", err)
	}

	// Apply enabled pipeline actions
	var processed image.Image = img
	if bp.pipeline != nil {
		disabledMap := make(map[int]bool)
		for _, idx := range config.DisabledIndices {
			disabledMap[idx] = true
		}

		currentImg := img
		for idx, action := range bp.pipeline.Actions {
			if !disabledMap[idx] {
				currentImg, err = action.Apply(currentImg)
				if err != nil {
					return fmt.Errorf("pipeline action %s error: %w", action.Name(), err)
				}
			}
		}
		processed = currentImg
	}

	bounds := processed.Bounds()
	outWidth := bounds.Dx()
	outHeight := bounds.Dy()

	outFilename := naming.FormatFilename(config.NamingPattern, naming.Options{
		OriginalPath: inputPath,
		Width:        outWidth,
		Height:       outHeight,
		Index:        index,
		TargetFormat: targetFormat,
	})

	outputPath := filepath.Join(config.OutputDir, outFilename)

	// Save processed image
	var saveErr error
	ext := strings.ToLower(filepath.Ext(outputPath))
	switch ext {
	case ".jpg", ".jpeg":
		saveErr = imaging.Save(processed, outputPath, imaging.JPEGQuality(quality))
	case ".webp":
		f, createErr := os.Create(outputPath)
		if createErr != nil {
			saveErr = createErr
		} else {
			saveErr = webp.Encode(f, processed, &webp.Options{Quality: float32(quality)})
			f.Close()
		}
	default:
		saveErr = imaging.Save(processed, outputPath)
	}

	if saveErr != nil {
		return fmt.Errorf("save error: %w", saveErr)
	}

	return nil
}
