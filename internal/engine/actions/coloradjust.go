package actions

import (
	"image"

	"github.com/disintegration/imaging"
)

// ColorAdjustAction adjusts color properties of an image.
type ColorAdjustAction struct {
	Brightness float64 `json:"brightness"` // -100 to 100
	Contrast   float64 `json:"contrast"`   // -100 to 100
	Saturation float64 `json:"saturation"` // -100 to 100
	Grayscale  bool    `json:"grayscale"`
	Invert     bool    `json:"invert"`
}

func NewColorAdjustAction(brightness, contrast, saturation float64, grayscale, invert bool) *ColorAdjustAction {
	return &ColorAdjustAction{
		Brightness: brightness,
		Contrast:   contrast,
		Saturation: saturation,
		Grayscale:  grayscale,
		Invert:     invert,
	}
}

func (c *ColorAdjustAction) Name() string {
	return "ColorAdjust"
}

func (c *ColorAdjustAction) Apply(img image.Image) (image.Image, error) {
	if img == nil {
		return nil, nil
	}

	result := img

	if c.Grayscale {
		result = imaging.Grayscale(result)
	}

	if c.Invert {
		result = imaging.Invert(result)
	}

	if c.Brightness != 0 {
		// imaging expects percentage -100 to 100
		result = imaging.AdjustBrightness(result, c.Brightness)
	}

	if c.Contrast != 0 {
		result = imaging.AdjustContrast(result, c.Contrast)
	}

	if c.Saturation != 0 {
		result = imaging.AdjustSaturation(result, c.Saturation)
	}

	return result, nil
}
