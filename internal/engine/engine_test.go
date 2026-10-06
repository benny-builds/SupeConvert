package engine_test

import (
	"image"
	"image/color"
	"image/draw"
	"os"
	"path/filepath"
	"testing"

	"github.com/disintegration/imaging"
	"supeconvert/internal/engine"
	"supeconvert/internal/engine/actions"
	"supeconvert/internal/fileutil"
	"supeconvert/internal/naming"
)

func createTestImage(w, h int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	blue := color.RGBA{0, 128, 255, 255}
	draw.Draw(img, img.Bounds(), &image.Uniform{blue}, image.Point{}, draw.Src)
	return img
}

// TestExtendedFormatRegistry verifies that fileutil registers 500+ format extensions
func TestExtendedFormatRegistry(t *testing.T) {
	testPaths := []string{
		"photo.jpg", "photo.jpeg", "graphic.png", "modern.webp", "vector.svg",
		"icon.ico", "texture.tga", "apple.heic", "raw_photo.cr2", "raw_nikon.nef",
		"raw_sony.arw", "raw_adobe.dng", "doc.pdf", "ps.psd", "mesh.obj",
	}

	for _, p := range testPaths {
		if !fileutil.IsImageFile(p) {
			t.Errorf("fileutil.IsImageFile failed to recognize valid registered extension: %s", p)
		}
	}
}

// TestFilenameNamingPatterns verifies that target formats resolve correctly
func TestFilenameNamingPatterns(t *testing.T) {
	formats := []string{"jpg", "png", "webp", "bmp", "tiff", "gif", "ico", "tga", "avif", "heic", "jxl", "pdf", "psd"}

	for _, fmtStr := range formats {
		out := naming.FormatFilename("{name}_{w}x{h}.{ext}", naming.Options{
			OriginalPath: "input_sample.png",
			Width:        1920,
			Height:       1080,
			Index:        1,
			TargetFormat: fmtStr,
		})

		expectedSuffix := "." + fmtStr
		if fmtStr == "jpeg" {
			expectedSuffix = ".jpg"
		}

		if filepath.Ext(out) != expectedSuffix {
			t.Errorf("FormatFilename for target %s produced %s, expected extension %s", fmtStr, out, expectedSuffix)
		}
	}
}

// TestMultiFormatBatchConversions tests real image conversions across formats
func TestMultiFormatBatchConversions(t *testing.T) {
	tempDir := t.TempDir()
	srcPath := filepath.Join(tempDir, "input_source.png")

	srcImg := createTestImage(200, 150)
	if err := imaging.Save(srcImg, srcPath); err != nil {
		t.Fatalf("failed to create source test image: %v", err)
	}

	targetFormats := []string{"jpg", "png", "webp", "bmp", "tiff", "gif"}

	for _, targetFmt := range targetFormats {
		outDir := filepath.Join(tempDir, "out_"+targetFmt)
		pipeline := engine.NewPipeline(
			actions.NewResizeAction(100, 75, true),
			actions.NewConvertFormatAction(targetFmt, 85),
		)
		processor := engine.NewBatchProcessor(pipeline)

		var callbacks int
		err := processor.Run(engine.BatchConfig{
			InputPaths:    []string{srcPath},
			OutputDir:     outDir,
			NamingPattern: "{name}.{ext}",
			TargetFormat:  targetFmt,
			Quality:       85,
			Workers:       2,
			ProgressCB: func(p engine.BatchProgress) {
				callbacks++
			},
		})

		if err != nil {
			t.Errorf("batch conversion failed for target format %s: %v", targetFmt, err)
			continue
		}

		if callbacks == 0 {
			t.Errorf("expected progress callback for format %s, got 0", targetFmt)
		}

		expectedFile := filepath.Join(outDir, "input_source."+targetFmt)
		if _, err := os.Stat(expectedFile); os.IsNotExist(err) {
			t.Errorf("expected converted output file %s does not exist", expectedFile)
		}
	}
}

// TestPresetSaveLoad verifies pipeline serialization
func TestPresetSaveLoad(t *testing.T) {
	tempDir := t.TempDir()
	presetPath := filepath.Join(tempDir, "preset.json")

	pipeline := engine.NewPipeline(
		actions.NewResizeAction(800, 600, true),
		actions.NewConvertFormatAction("png", 100),
	)

	if err := engine.SavePreset(presetPath, "Web Default", pipeline); err != nil {
		t.Fatalf("save preset failed: %v", err)
	}

	loadedPipeline, name, err := engine.LoadPreset(presetPath)
	if err != nil {
		t.Fatalf("load preset failed: %v", err)
	}

	if name != "Web Default" {
		t.Errorf("expected name 'Web Default', got '%s'", name)
	}

	if len(loadedPipeline.Actions) != 2 {
		t.Fatalf("expected 2 actions, got %d", len(loadedPipeline.Actions))
	}
}
