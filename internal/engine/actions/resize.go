package actions

import "image"

import "github.com/disintegration/imaging"

// ResizeAction resizes an image.
type ResizeAction struct {
	Width          int  `json:"width"`
	Height         int  `json:"height"`
	MaintainAspect bool `json:"maintain_aspect"`
}

func NewResizeAction(width, height int, maintainAspect bool) *ResizeAction {
	return &ResizeAction{
		Width:          width,
		Height:         height,
		MaintainAspect: maintainAspect,
	}
}

func (r *ResizeAction) Name() string {
	return "Resize"
}

func (r *ResizeAction) Apply(img image.Image) (image.Image, error) {
	if img == nil {
		return nil, nil
	}

	if r.Width <= 0 && r.Height <= 0 {
		return img, nil
	}

	if r.MaintainAspect {
		if r.Width <= 0 || r.Height <= 0 {
			// imaging.Resize automatically calculates missing dimension proportionally when 0
			return imaging.Resize(img, r.Width, r.Height, imaging.Lanczos), nil
		}
		return imaging.Fit(img, r.Width, r.Height, imaging.Lanczos), nil
	}

	w := r.Width
	h := r.Height
	bounds := img.Bounds()
	if w <= 0 {
		w = bounds.Dx()
	}
	if h <= 0 {
		h = bounds.Dy()
	}

	return imaging.Resize(img, w, h, imaging.Lanczos), nil
}
