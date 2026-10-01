package naming

import (
	"fmt"
	"path/filepath"
	"strings"
)

// Options holds metadata for filename formatting.
type Options struct {
	OriginalPath string
	Width        int
	Height       int
	Index        int
	TargetFormat string
}

// FormatFilename resolves template pattern string into output filename.
// Example pattern: "{name}_{w}x{h}.{ext}"
func FormatFilename(pattern string, opts Options) string {
	if pattern == "" {
		pattern = "{name}.{ext}"
	}

	base := filepath.Base(opts.OriginalPath)
	ext := filepath.Ext(base)
	nameWithoutExt := strings.TrimSuffix(base, ext)

	targetExt := strings.ToLower(opts.TargetFormat)
	if targetExt == "" {
		targetExt = strings.TrimPrefix(strings.ToLower(ext), ".")
	}
	if targetExt == "jpeg" {
		targetExt = "jpg"
	}

	result := pattern
	result = strings.ReplaceAll(result, "{name}", nameWithoutExt)
	result = strings.ReplaceAll(result, "{w}", fmt.Sprintf("%d", opts.Width))
	result = strings.ReplaceAll(result, "{h}", fmt.Sprintf("%d", opts.Height))
	result = strings.ReplaceAll(result, "{index}", fmt.Sprintf("%d", opts.Index))
	result = strings.ReplaceAll(result, "{ext}", targetExt)

	// Check if pattern explicitly included a valid image extension already
	resLower := strings.ToLower(result)
	knownExts := []string{
		".jpg", ".jpeg", ".jpe", ".png", ".webp", ".bmp", ".dib", ".gif", ".tiff", ".tif",
		".svg", ".ico", ".tga", ".tpic", ".psd", ".pdd", ".dds", ".pcx",
		".avif", ".heic", ".heif", ".jxl",
		".cr2", ".cr3", ".nef", ".arw", ".dng", ".orf", ".rw2", ".pef", ".raf", ".srw",
		".ppm", ".pgm", ".pbm", ".pnm", ".hdr", ".exr",
	}
	for _, kExt := range knownExts {
		if strings.HasSuffix(resLower, kExt) {
			return result
		}
	}

	// Ensure extension if pattern didn't include target extension
	if !strings.HasSuffix(resLower, "."+targetExt) {
		result = result + "." + targetExt
	}

	return result
}
