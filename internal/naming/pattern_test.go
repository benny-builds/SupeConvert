package naming_test

import (
	"testing"

	"supeconvert/internal/naming"
)

func TestFormatFilename(t *testing.T) {
	tests := []struct {
		pattern  string
		opts     naming.Options
		expected string
	}{
		{
			pattern: "{name}_{w}x{h}.{ext}",
			opts: naming.Options{
				OriginalPath: "/path/to/landscape.png",
				Width:        1920,
				Height:       1080,
				Index:        1,
				TargetFormat: "jpg",
			},
			expected: "landscape_1920x1080.jpg",
		},
		{
			pattern: "{index}_{name}.{ext}",
			opts: naming.Options{
				OriginalPath: "banner.jpeg",
				Width:        800,
				Height:       600,
				Index:        5,
				TargetFormat: "webp",
			},
			expected: "5_banner.webp",
		},
		{
			pattern: "", // Default pattern fallthrough
			opts: naming.Options{
				OriginalPath: "photo.bmp",
				Width:        100,
				Height:       100,
				Index:        1,
				TargetFormat: "png",
			},
			expected: "photo.png",
		},
	}

	for _, tt := range tests {
		actual := naming.FormatFilename(tt.pattern, tt.opts)
		if actual != tt.expected {
			t.Errorf("FormatFilename(%s) = %s, expected %s", tt.pattern, actual, tt.expected)
		}
	}
}
