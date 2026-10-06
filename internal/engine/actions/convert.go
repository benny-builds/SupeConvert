package actions

import (
	"image"
	"strings"
)

// ConvertFormatAction defines output image format conversion.
type ConvertFormatAction struct {
	TargetFormat string `json:"target_format"` // "jpg", "png", "webp", "bmp", "gif", "tiff"
	Quality      int    `json:"quality"`       // 1-100 for lossy formats (JPEG/WebP)
}

func NewConvertFormatAction(format string, quality int) *ConvertFormatAction {
	if quality <= 0 {
		quality = 85
	}
	return &ConvertFormatAction{
		TargetFormat: strings.ToLower(format),
		Quality:      quality,
	}
}

func (c *ConvertFormatAction) Name() string {
	return "ConvertFormat"
}

func (c *ConvertFormatAction) Apply(img image.Image) (image.Image, error) {
	// Format conversion occurs during file encoding/saving, image pixel buffer unchanged.
	return img, nil
}
