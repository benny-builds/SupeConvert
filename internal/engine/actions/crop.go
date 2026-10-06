package actions

import (
	"image"

	"github.com/disintegration/imaging"
)

// CropAction crops image using specified rectangle coordinates or center crop.
type CropAction struct {
	X      int  `json:"x"`
	Y      int  `json:"y"`
	Width  int  `json:"width"`
	Height int  `json:"height"`
	Center bool `json:"center"`
}

func NewCropAction(x, y, w, h int, center bool) *CropAction {
	return &CropAction{
		X:      x,
		Y:      y,
		Width:  w,
		Height: h,
		Center: center,
	}
}

func (c *CropAction) Name() string {
	return "Crop"
}

func (c *CropAction) Apply(img image.Image) (image.Image, error) {
	if img == nil {
		return nil, nil
	}

	if c.Width <= 0 || c.Height <= 0 {
		return img, nil
	}

	if c.Center {
		return imaging.CropCenter(img, c.Width, c.Height), nil
	}

	rect := image.Rect(c.X, c.Y, c.X+c.Width, c.Y+c.Height)
	return imaging.Crop(img, rect), nil
}
