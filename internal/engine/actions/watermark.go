package actions

import (
	"image"
	"strings"

	"github.com/disintegration/imaging"
)

// WatermarkAction overlays a watermark image onto target image.
type WatermarkAction struct {
	WatermarkPath string  `json:"watermark_path"`
	Opacity       float64 `json:"opacity"`  // 0.0 to 1.0
	Position      string  `json:"position"` // "center", "top_left", "top_right", "bottom_left", "bottom_right"
	Scale         float64 `json:"scale"`    // 0 = original size; >0 = fraction of background width (e.g. 0.25 = 25% of image width)
}

func NewWatermarkAction(path string, opacity float64, position string, scale float64) *WatermarkAction {
	if opacity <= 0 {
		opacity = 1.0
	}
	if position == "" {
		position = "bottom_right"
	}
	return &WatermarkAction{
		WatermarkPath: path,
		Opacity:       opacity,
		Position:      position,
		Scale:         scale,
	}
}

func (w *WatermarkAction) Name() string {
	return "Watermark"
}

func (w *WatermarkAction) Apply(img image.Image) (image.Image, error) {
	if img == nil || w.WatermarkPath == "" {
		return img, nil
	}

	wmImg, err := imaging.Open(w.WatermarkPath)
	if err != nil {
		return img, nil // skip if watermark file cannot be opened
	}

	// Resize watermark if Scale is set (fraction of background width)
	if w.Scale > 0 {
		bgW := img.Bounds().Dx()
		targetW := int(float64(bgW) * w.Scale)
		if targetW < 1 {
			targetW = 1
		}
		wmImg = imaging.Resize(wmImg, targetW, 0, imaging.Lanczos)
	}

	pos := strings.ToLower(w.Position)
	pt := getAnchorPt(img.Bounds(), wmImg.Bounds(), pos)
	return imaging.Overlay(img, wmImg, pt, w.Opacity), nil
}

func getAnchorPt(bgBounds, wmBounds image.Rectangle, anchor string) image.Point {
	bgW, bgH := bgBounds.Dx(), bgBounds.Dy()
	wmW, wmH := wmBounds.Dx(), wmBounds.Dy()

	switch anchor {
	case "center":
		return image.Pt((bgW-wmW)/2, (bgH-wmH)/2)
	case "top_left":
		return image.Pt(10, 10)
	case "top_right":
		return image.Pt(bgW-wmW-10, 10)
	case "bottom_left":
		return image.Pt(10, bgH-wmH-10)
	case "bottom_right":
		return image.Pt(bgW-wmW-10, bgH-wmH-10)
	default:
		return image.Pt(bgW-wmW-10, bgH-wmH-10)
	}
}
