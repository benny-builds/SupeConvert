package fileutil_test

import (
	"os"
	"path/filepath"
	"testing"

	"supeconvert/internal/fileutil"
)

func TestIsImageFile(t *testing.T) {
	valid := []string{"test.jpg", "photo.PNG", "graphic.WEBP", "vector.SVG", "doc.pdf", "psd.psd", "camera.cr2"}
	invalid := []string{"script.js", "program.exe", "library.dll", "file.go", "style.css"}

	for _, v := range valid {
		if !fileutil.IsImageFile(v) {
			t.Errorf("IsImageFile(%s) = false, expected true", v)
		}
	}

	for _, inv := range invalid {
		if fileutil.IsImageFile(inv) {
			t.Errorf("IsImageFile(%s) = true, expected false", inv)
		}
	}
}

func TestDiscoverImages(t *testing.T) {
	tempDir := t.TempDir()

	// Create test files
	img1 := filepath.Join(tempDir, "img1.png")
	img2 := filepath.Join(tempDir, "img2.jpg")
	nonImg := filepath.Join(tempDir, "data.exe")

	_ = os.WriteFile(img1, []byte("fake png"), 0644)
	_ = os.WriteFile(img2, []byte("fake jpg"), 0644)
	_ = os.WriteFile(nonImg, []byte("hello binary"), 0644)

	// Create subfolder with nested image
	subDir := filepath.Join(tempDir, "sub")
	_ = os.Mkdir(subDir, 0755)
	img3 := filepath.Join(subDir, "img3.webp")
	_ = os.WriteFile(img3, []byte("fake webp"), 0644)

	// Test non-recursive
	flatImages, err := fileutil.DiscoverImages(tempDir, false)
	if err != nil {
		t.Fatalf("DiscoverImages non-recursive error: %v", err)
	}
	if len(flatImages) != 2 {
		t.Errorf("expected 2 flat images, got %d", len(flatImages))
	}

	// Test recursive
	recImages, err := fileutil.DiscoverImages(tempDir, true)
	if err != nil {
		t.Fatalf("DiscoverImages recursive error: %v", err)
	}
	if len(recImages) != 3 {
		t.Errorf("expected 3 recursive images, got %d", len(recImages))
	}
}
